import '../config/load-env.js';
import mongoose from 'mongoose';
import { connectMongo, disconnectMongo } from '../database/index.js';
import { syncSemesterCalendar } from '../services/institution/sync-semester-calendar.js';

const institutionId = process.env.SEED_INSTITUTION_ID?.trim();
if (!institutionId) throw new Error('SEED_INSTITUTION_ID required');

await connectMongo();
await syncSemesterCalendar(institutionId);
const db = mongoose.connection.db!;
const sems = await db
  .collection('semesters')
  .find({ deletedAt: null }, { projection: { name: 1, number: 1, term: 1, status: 1, startDate: 1, endDate: 1 } })
  .sort({ number: 1 })
  .toArray();
console.log(
  sems.map((row) => ({
    name: row.name,
    term: row.term,
    status: row.status,
    start: new Date(row.startDate).toISOString().slice(0, 10),
    end: new Date(row.endDate).toISOString().slice(0, 10),
  })),
);
await disconnectMongo();

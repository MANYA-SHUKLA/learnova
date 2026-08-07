# Course Permissions

## Permission Levels

### `course:read`
- View course list and details
- View course modules and lessons
- Access published course content
- View own progress (students)

**Granted to**:
- Students (for enrolled/published courses)
- Faculty (all courses)
- Institution Admin (all courses)

### `course:write`
- Update course details
- Create/edit/delete modules
- Create/edit/delete lessons
- Update course content
- Manage course materials

**Granted to**:
- Faculty (assigned courses)
- Institution Admin (all courses)

### `course:manage`
- All `course:write` permissions
- Create new courses
- Delete courses
- Publish/unpublish courses
- Archive/restore courses
- Assign faculty to courses
- Manage course settings

**Granted to**:
- Institution Admin only

## Role-Based Access

### Student
- Permissions: `course:read`
- Can view published courses
- Can track own progress
- Cannot edit course content

### Faculty
- Permissions: `course:read`, `course:write`
- Can view all courses
- Can edit assigned courses
- Can create course content
- Cannot create/delete courses
- Cannot publish courses

### Institution Admin
- Permissions: `course:read`, `course:write`, `course:manage`
- Full course management access
- Can create, edit, delete courses
- Can publish and archive courses
- Can assign faculty to courses

## Access Control Rules

1. **Course Visibility**:
   - Draft courses: Only visible to assigned faculty and admins
   - Published courses: Visible to all authenticated users
   - Archived courses: Visible only to admins (unless includeArchived param)

2. **Faculty Assignment**:
   - Faculty can only edit courses they are assigned to
   - Admins can edit any course
   - Coordinators have same access as assigned faculty

3. **Student Progress**:
   - Students can only view/update their own progress
   - Faculty can view progress of students in their courses
   - Admins can view all progress data

4. **Content Access**:
   - Unpublished lessons are only visible to faculty and admins
   - Students can only access lessons in published courses they are enrolled in

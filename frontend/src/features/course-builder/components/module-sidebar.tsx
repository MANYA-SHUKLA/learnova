/**
 * Module sidebar — expandable modules, nested lessons, drag handles
 */

'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Input, Badge } from '@learnova/ui';
import {
  ChevronRight,
  Plus,
  GripVertical,
  MoreVertical,
  FileText,
  FolderOpen,
  Folder,
  Trash2,
  Copy,
  Edit2,
} from 'lucide-react';
import type { CourseBuilderModuleNode } from '@learnova/types';
import { useBuilderStore } from '../store/builder-store';
import {
  useCreateModuleMutation,
  useCreateLessonMutation,
  useDeleteModuleMutation,
  useDeleteLessonMutation,
  useDuplicateModuleMutation,
  useDuplicateLessonMutation,
  useReorderModulesMutation,
  useReorderLessonsMutation,
  useUpdateModuleMutation,
} from '../hooks/use-builder-queries';
import { formatLessonStatus } from '../lib/labels';

interface ModuleSidebarProps {
  courseId: string;
  modules: CourseBuilderModuleNode[];
}

export function ModuleSidebar({ courseId, modules }: ModuleSidebarProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [isCreatingModule, setIsCreatingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState('');
  const [actionsMenuId, setActionsMenuId] = useState<string | null>(null);
  const [creatingLessonModuleId, setCreatingLessonModuleId] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [pendingDelete, setPendingDelete] = useState<{ type: 'module' | 'lesson'; id: string } | null>(
    null,
  );

  const selectedLessonId = useBuilderStore((s) => s.selectedLessonId);
  const setSelectedLesson = useBuilderStore((s) => s.setSelectedLesson);
  const searchQuery = useBuilderStore((s) => s.searchQuery);
  const setSearchQuery = useBuilderStore((s) => s.setSearchQuery);

  const createModuleMutation = useCreateModuleMutation(courseId);
  const updateModuleMutation = useUpdateModuleMutation(courseId);
  const deleteModuleMutation = useDeleteModuleMutation(courseId);
  const duplicateModuleMutation = useDuplicateModuleMutation(courseId);
  const createLessonMutation = useCreateLessonMutation(courseId);
  const deleteLessonMutation = useDeleteLessonMutation(courseId);
  const duplicateLessonMutation = useDuplicateLessonMutation(courseId);
  const reorderModulesMutation = useReorderModulesMutation(courseId);
  const reorderLessonsMutation = useReorderLessonsMutation(courseId);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateModule = async () => {
    if (!newModuleTitle.trim()) return;
    try {
      await createModuleMutation.mutateAsync({
        title: newModuleTitle.trim(),
        status: 'draft',
        visibility: 'enrolled',
      });
      setNewModuleTitle('');
      setIsCreatingModule(false);
    } catch {
      // handled
    }
  };

  const handleRenameModule = async (moduleId: string) => {
    if (!editModuleTitle.trim()) return;
    try {
      await updateModuleMutation.mutateAsync({
        moduleId,
        body: { title: editModuleTitle.trim() },
      });
      setEditingModuleId(null);
    } catch {
      // handled
    }
  };

  const handleDeleteModule = (moduleId: string) => {
    setPendingDelete({ type: 'module', id: moduleId });
    setActionsMenuId(null);
  };

  const confirmDeleteModule = (moduleId: string) => {
    void deleteModuleMutation.mutateAsync(moduleId);
    setPendingDelete(null);
  };

  const handleDuplicateModule = (moduleId: string) => {
    void duplicateModuleMutation.mutateAsync(moduleId);
  };

  const startCreateLesson = (moduleId: string) => {
    setCreatingLessonModuleId(moduleId);
    setNewLessonTitle('');
    setExpandedModules((prev) => new Set(prev).add(moduleId));
    setActionsMenuId(null);
  };

  const handleCreateLesson = async (moduleId: string) => {
    if (!newLessonTitle.trim()) return;
    try {
      await createLessonMutation.mutateAsync({
        moduleId,
        title: newLessonTitle.trim(),
        lessonType: 'rich_text',
        status: 'draft',
        visibility: 'enrolled',
      });
      setCreatingLessonModuleId(null);
      setNewLessonTitle('');
    } catch {
      // handled
    }
  };

  const handleDeleteLesson = (lessonId: string) => {
    setPendingDelete({ type: 'lesson', id: lessonId });
    setActionsMenuId(null);
  };

  const confirmDeleteLesson = (lessonId: string) => {
    void deleteLessonMutation.mutateAsync(lessonId);
    if (selectedLessonId === lessonId) {
      setSelectedLesson(null);
    }
    setPendingDelete(null);
  };

  const handleDuplicateLesson = (lessonId: string) => {
    void duplicateLessonMutation.mutateAsync(lessonId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeModule = modules.find((m) => m.id === activeId);
    const overModule = modules.find((m) => m.id === overId);

    if (activeModule && overModule) {
      const oldIndex = modules.indexOf(activeModule);
      const newIndex = modules.indexOf(overModule);
      const reordered = arrayMove(modules, oldIndex, newIndex);
      void reorderModulesMutation.mutateAsync(reordered.map((m) => m.id));
    } else {
      for (const mod of modules) {
        const activeLesson = mod.lessons.find((l) => l.id === activeId);
        const overLesson = mod.lessons.find((l) => l.id === overId);
        if (activeLesson && overLesson) {
          const oldIndex = mod.lessons.indexOf(activeLesson);
          const newIndex = mod.lessons.indexOf(overLesson);
          const reordered = arrayMove(mod.lessons, oldIndex, newIndex);
          void reorderLessonsMutation.mutateAsync({
            moduleId: mod.id,
            lessonIds: reordered.map((l) => l.id),
          });
          break;
        }
      }
    }
  };

  const filteredModules = modules.filter((mod) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      mod.title.toLowerCase().includes(q) ||
      mod.lessons.some((l) => l.title.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex h-full flex-col border-r border-border bg-background">
      <div className="border-b border-border px-4 py-3">
        <Input
          placeholder="Search modules & lessons…"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); }}
          className="mb-2"
        />
        {!isCreatingModule ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => { setIsCreatingModule(true); }}
          >
            <Plus className="size-4" />
            Add Module
          </Button>
        ) : (
          <div className="space-y-2">
            <Input
              autoFocus
              placeholder="Module title"
              value={newModuleTitle}
              onChange={(e) => { setNewModuleTitle(e.target.value); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCreateModule();
                if (e.key === 'Escape') setIsCreatingModule(false);
              }}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleCreateModule}
                disabled={createModuleMutation.isPending}
              >
                Create
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => { setIsCreatingModule(false); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            {filteredModules.map((mod) => (
              <ModuleItem
                key={mod.id}
                module={mod}
                isExpanded={expandedModules.has(mod.id)}
                onToggle={() => { toggleModule(mod.id); }}
                isEditing={editingModuleId === mod.id}
                editTitle={editModuleTitle}
                onEditTitleChange={setEditModuleTitle}
                onStartEdit={() => {
                  setEditingModuleId(mod.id);
                  setEditModuleTitle(mod.title);
                }}
                onSaveEdit={() => handleRenameModule(mod.id)}
                onCancelEdit={() => { setEditingModuleId(null); }}
                onDelete={() => { handleDeleteModule(mod.id); }}
                onDuplicate={() => { handleDuplicateModule(mod.id); }}
                onAddLesson={() => { startCreateLesson(mod.id); }}
                creatingLesson={creatingLessonModuleId === mod.id}
                newLessonTitle={newLessonTitle}
                onNewLessonTitleChange={setNewLessonTitle}
                onSubmitCreateLesson={() => void handleCreateLesson(mod.id)}
                onCancelCreateLesson={() => {
                  setCreatingLessonModuleId(null);
                  setNewLessonTitle('');
                }}
                pendingDelete={pendingDelete}
                onConfirmDelete={() => {
                  if (pendingDelete?.type === 'module' && pendingDelete.id === mod.id) {
                    confirmDeleteModule(mod.id);
                  }
                }}
                onCancelDelete={() => { setPendingDelete(null); }}
                selectedLessonId={selectedLessonId}
                onSelectLesson={setSelectedLesson}
                onDeleteLesson={handleDeleteLesson}
                onConfirmDeleteLesson={confirmDeleteLesson}
                onDuplicateLesson={handleDuplicateLesson}
                actionsMenuId={actionsMenuId}
                setActionsMenuId={setActionsMenuId}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

interface ModuleItemProps {
  module: CourseBuilderModuleNode;
  isExpanded: boolean;
  onToggle: () => void;
  isEditing: boolean;
  editTitle: string;
  onEditTitleChange: (title: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddLesson: () => void;
  creatingLesson: boolean;
  newLessonTitle: string;
  onNewLessonTitleChange: (title: string) => void;
  onSubmitCreateLesson: () => void;
  onCancelCreateLesson: () => void;
  pendingDelete: { type: 'module' | 'lesson'; id: string } | null;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  selectedLessonId: string | null;
  onSelectLesson: (id: string) => void;
  onDeleteLesson: (id: string) => void;
  onConfirmDeleteLesson: (id: string) => void;
  onDuplicateLesson: (id: string) => void;
  actionsMenuId: string | null;
  setActionsMenuId: (id: string | null) => void;
}

function ModuleItem({
  module,
  isExpanded,
  onToggle,
  isEditing,
  editTitle,
  onEditTitleChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onDuplicate,
  onAddLesson,
  creatingLesson,
  newLessonTitle,
  onNewLessonTitleChange,
  onSubmitCreateLesson,
  onCancelCreateLesson,
  pendingDelete,
  onConfirmDelete,
  onCancelDelete,
  selectedLessonId,
  onSelectLesson,
  onDeleteLesson,
  onConfirmDeleteLesson,
  onDuplicateLesson,
  actionsMenuId,
  setActionsMenuId,
}: ModuleItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: module.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const showActions = actionsMenuId === `module-${module.id}`;

  return (
    <div ref={setNodeRef} style={style} className="mb-1">
      <div
        className="group relative flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/60"
        onContextMenu={(e) => {
          e.preventDefault();
          setActionsMenuId(showActions ? null : `module-${module.id}`);
        }}
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder module ${module.title}`}
          className="cursor-grab rounded-sm active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <GripVertical className="size-4 text-muted-foreground" />
        </button>
        <button type="button" onClick={onToggle} className="flex items-center gap-1 text-sm">
          <ChevronRight
            className={`size-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
          {isExpanded ? (
            <FolderOpen className="size-4 text-primary" />
          ) : (
            <Folder className="size-4 text-muted-foreground" />
          )}
        </button>
        {isEditing ? (
          <Input
            autoFocus
            value={editTitle}
            onChange={(e) => { onEditTitleChange(e.target.value); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveEdit();
              if (e.key === 'Escape') onCancelEdit();
            }}
            onBlur={onSaveEdit}
            className="h-7 flex-1 text-sm"
          />
        ) : (
          <span className="flex-1 truncate text-sm font-medium">{module.title}</span>
        )}
        <Badge variant="outline" className="text-xs">
          {module.lessons.length}
        </Badge>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => { setActionsMenuId(showActions ? null : `module-${module.id}`); }}
        >
          <MoreVertical className="size-4" />
        </Button>
      </div>
      {showActions ? (
        <div className="mb-1 ml-8 rounded-lg border border-border bg-background p-1 shadow-lg">
          {pendingDelete?.type === 'module' && pendingDelete.id === module.id ? (
            <div className="space-y-2 p-2">
              <p className="text-xs text-muted-foreground">Delete this module and all its lessons?</p>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="danger" className="flex-1" onClick={onConfirmDelete}>
                  Delete
                </Button>
                <Button type="button" size="sm" variant="outline" className="flex-1" onClick={onCancelDelete}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              onAddLesson();
              setActionsMenuId(null);
            }}
          >
            <Plus className="size-4" />
            Add Lesson
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              onStartEdit();
              setActionsMenuId(null);
            }}
          >
            <Edit2 className="size-4" />
            Rename
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              onDuplicate();
              setActionsMenuId(null);
            }}
          >
            <Copy className="size-4" />
            Duplicate
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start text-destructive"
            onClick={() => {
              onDelete();
              setActionsMenuId(null);
            }}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
            </>
          )}
        </div>
      ) : null}
      {isExpanded ? (
        <SortableContext
          items={module.lessons.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="ml-8 space-y-1">
            {module.lessons.map((lesson) => (
              <LessonItem
                key={lesson.id}
                lesson={lesson}
                isSelected={selectedLessonId === lesson.id}
                onSelect={() => { onSelectLesson(lesson.id); }}
                onDelete={() => { onDeleteLesson(lesson.id); }}
                onDuplicate={() => { onDuplicateLesson(lesson.id); }}
                pendingDelete={pendingDelete}
                onConfirmDelete={() => { onConfirmDeleteLesson(lesson.id); }}
                onCancelDelete={onCancelDelete}
                actionsMenuId={actionsMenuId}
                setActionsMenuId={setActionsMenuId}
              />
            ))}
            {creatingLesson ? (
              <div className="space-y-2 rounded-lg border border-border/80 bg-muted/20 p-2">
                <Input
                  autoFocus
                  placeholder="Lesson title"
                  value={newLessonTitle}
                  onChange={(e) => { onNewLessonTitleChange(e.target.value); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSubmitCreateLesson();
                    if (e.key === 'Escape') onCancelCreateLesson();
                  }}
                  className="h-8 text-sm"
                />
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={onSubmitCreateLesson}>
                    Add lesson
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={onCancelCreateLesson}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-2 w-[calc(100%-0.5rem)] justify-start text-muted-foreground"
                onClick={onAddLesson}
              >
                <Plus className="size-4" />
                Add lesson
              </Button>
            )}
          </div>
        </SortableContext>
      ) : null}
    </div>
  );
}

interface LessonItemProps {
  lesson: { id: string; title: string; status: string };
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  pendingDelete: { type: 'module' | 'lesson'; id: string } | null;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  actionsMenuId: string | null;
  setActionsMenuId: (id: string | null) => void;
}

function LessonItem({
  lesson,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  pendingDelete,
  onConfirmDelete,
  onCancelDelete,
  actionsMenuId,
  setActionsMenuId,
}: LessonItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const showActions = actionsMenuId === `lesson-${lesson.id}`;

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`group relative flex items-center gap-2 rounded-lg px-2 py-1.5 ${
          isSelected ? 'bg-primary/10' : 'hover:bg-muted/60'
        }`}
        onContextMenu={(e) => {
          e.preventDefault();
          setActionsMenuId(showActions ? null : `lesson-${lesson.id}`);
        }}
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder lesson ${lesson.title}`}
          className="cursor-grab rounded-sm active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <GripVertical className="size-4 text-muted-foreground" />
        </button>
        <FileText className="size-4 text-muted-foreground" />
        <button
          type="button"
          onClick={onSelect}
          aria-current={isSelected ? 'true' : undefined}
          className="flex-1 truncate text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          {lesson.title}
        </button>
        <Badge variant={lesson.status === 'published' ? 'default' : 'secondary'} className="text-xs">
          {formatLessonStatus(lesson.status as never)}
        </Badge>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => { setActionsMenuId(showActions ? null : `lesson-${lesson.id}`); }}
        >
          <MoreVertical className="size-4" />
        </Button>
      </div>
      {showActions ? (
        <div className="mb-1 ml-6 rounded-lg border border-border bg-background p-1 shadow-lg">
          {pendingDelete?.type === 'lesson' && pendingDelete.id === lesson.id ? (
            <div className="space-y-2 p-2">
              <p className="text-xs text-muted-foreground">Delete this lesson?</p>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="danger" className="flex-1" onClick={onConfirmDelete}>
                  Delete
                </Button>
                <Button type="button" size="sm" variant="outline" className="flex-1" onClick={onCancelDelete}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              onDuplicate();
              setActionsMenuId(null);
            }}
          >
            <Copy className="size-4" />
            Duplicate
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start text-destructive"
            onClick={() => {
              onDelete();
              setActionsMenuId(null);
            }}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

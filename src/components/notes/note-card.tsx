'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Archive, Pin, Trash2, MoreVertical, Palette } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useI18n } from '@/lib/i18n/i18n-context';
import type { Note } from '@/lib/db/notes-service';

const NOTE_COLORS = [
  { name: 'White', value: '#ffffff', bgClass: 'bg-white' },
  { name: 'Red', value: '#f28b82', bgClass: 'bg-red-200' },
  { name: 'Orange', value: '#fbbc04', bgClass: 'bg-orange-200' },
  { name: 'Yellow', value: '#fff475', bgClass: 'bg-yellow-200' },
  { name: 'Green', value: '#ccff90', bgClass: 'bg-green-200' },
  { name: 'Teal', value: '#a7ffeb', bgClass: 'bg-teal-200' },
  { name: 'Blue', value: '#cbf0f8', bgClass: 'bg-blue-200' },
  { name: 'Purple', value: '#d7aefb', bgClass: 'bg-purple-200' },
  { name: 'Pink', value: '#fdcfe8', bgClass: 'bg-pink-200' },
  { name: 'Gray', value: '#e8eaed', bgClass: 'bg-gray-200' },
];

interface NoteCardProps {
  note: Note;
  isEditing: boolean;
  onEdit: (note: Note) => void;
  onSave: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onArchive: (noteId: string) => void;
  onPin: (noteId: string) => void;
  onColorChange: (noteId: string, color: string) => void;
  onDragStart: (note: Note) => void;
  onDragEnd: () => void;
}

export function NoteCard({
  note,
  isEditing,
  onEdit,
  onSave,
  onDelete,
  onArchive,
  onPin,
  onColorChange,
  onDragStart,
  onDragEnd,
}: NoteCardProps) {
  const { t } = useI18n();
  const [editedTitle, setEditedTitle] = React.useState(note.title);
  const [editedContent, setEditedContent] = React.useState(note.content);

  React.useEffect(() => {
    setEditedTitle(note.title);
    setEditedContent(note.content);
  }, [note]);

  const handleSave = () => {
    onSave({
      ...note,
      title: editedTitle,
      content: editedContent,
    });
  };

  const getBackgroundColor = (color: string) => {
    return color;
  };

  return (
    <Card
      className="group relative cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden"
      style={{ backgroundColor: getBackgroundColor(note.color) }}
      draggable={!isEditing}
      onDragStart={() => onDragStart(note)}
      onDragEnd={onDragEnd}
      onClick={() => !isEditing && onEdit(note)}
    >
      <div className="p-4 space-y-2">
        {/* Pin indicator */}
        {note.pinned && (
          <div className="absolute top-2 right-2">
            <Pin className="h-4 w-4 text-gray-600 fill-current" />
          </div>
        )}

        {isEditing ? (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              placeholder={t('notes.noteTitle')}
              className="border-none bg-transparent focus-visible:ring-0 text-lg font-semibold p-0"
            />
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder={t('notes.noteContent')}
              className="border-none bg-transparent focus-visible:ring-0 resize-none min-h-[100px] p-0"
            />
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1">
                {/* Color picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Palette className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="start">
                    <div className="grid grid-cols-5 gap-2">
                      {NOTE_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => onColorChange(note.id, color.value)}
                          className={`h-8 w-8 rounded-full border-2 ${
                            note.color === color.value
                              ? 'border-black'
                              : 'border-transparent'
                          } hover:border-gray-400 transition-colors`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onPin(note.id)}
                >
                  <Pin className={`h-4 w-4 ${note.pinned ? 'fill-current' : ''}`} />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onArchive(note.id)}
                >
                  <Archive className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onDelete(note.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="default" size="sm" onClick={handleSave}>
                {t('notes.close')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {note.title && (
              <h3 className="font-semibold text-lg line-clamp-2">{note.title}</h3>
            )}
            <p className="text-sm whitespace-pre-wrap line-clamp-10">{note.content}</p>

            {/* Actions menu - only show on hover */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => onPin(note.id)}>
                    <Pin className="h-4 w-4 mr-2" />
                    {note.pinned ? t('notes.unpinNote') : t('notes.pinNote')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onArchive(note.id)}>
                    <Archive className="h-4 w-4 mr-2" />
                    {t('notes.archiveNote')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(note.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('notes.deleteNote')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

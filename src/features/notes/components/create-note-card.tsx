'use client';

import * as React from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Input } from '@/shared/components/ui/input';
import { Plus, Palette } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import { useI18n } from '@/shared/i18n/i18n-context';

const NOTE_COLORS = [
  { name: 'Default', value: 'default', bgClass: 'bg-card', textClass: 'text-card-foreground' },
  { name: 'Red', value: '#f28b82', bgClass: 'bg-red-200', textClass: 'text-gray-900' },
  { name: 'Orange', value: '#fbbc04', bgClass: 'bg-orange-200', textClass: 'text-gray-900' },
  { name: 'Yellow', value: '#fff475', bgClass: 'bg-yellow-200', textClass: 'text-gray-900' },
  { name: 'Green', value: '#ccff90', bgClass: 'bg-green-200', textClass: 'text-gray-900' },
  { name: 'Teal', value: '#a7ffeb', bgClass: 'bg-teal-200', textClass: 'text-gray-900' },
  { name: 'Blue', value: '#cbf0f8', bgClass: 'bg-blue-200', textClass: 'text-gray-900' },
  { name: 'Purple', value: '#d7aefb', bgClass: 'bg-purple-200', textClass: 'text-gray-900' },
  { name: 'Pink', value: '#fdcfe8', bgClass: 'bg-pink-200', textClass: 'text-gray-900' },
  { name: 'Gray', value: '#e8eaed', bgClass: 'bg-gray-200', textClass: 'text-gray-900' },
];

interface CreateNoteCardProps {
  onCreate: (data: { title: string; content: string; color: string }) => void;
}

export function CreateNoteCard({ onCreate }: CreateNoteCardProps) {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [color, setColor] = React.useState('default');

  const handleCreate = () => {
    if (content.trim()) {
      onCreate({ title, content, color });
      setTitle('');
      setContent('');
      setColor('default');
      setIsExpanded(false);
    }
  };

  const handleClose = () => {
    setIsExpanded(false);
    setTitle('');
    setContent('');
    setColor('default');
  };

  const isColoredNote = color !== 'default' && color !== '#ffffff';
  const getTextColor = (noteColor: string) => {
    if (noteColor === 'default') return 'text-card-foreground';
    return 'text-gray-900';
  };

  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow ${!isColoredNote ? '' : ''}`}
      style={isColoredNote ? { backgroundColor: color } : undefined}
    >
      {!isExpanded ? (
        <div
          className="p-4 flex items-center gap-2 text-muted-foreground"
          onClick={() => setIsExpanded(true)}
        >
          <Plus className="h-5 w-5" />
          <span>{t('notes.takeNote')}</span>
        </div>
      ) : (
        <div className={`p-4 space-y-2 ${getTextColor(color)}`}>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('notes.noteTitle')}
            className={`focus-visible:ring-0 text-lg font-semibold px-2 py-1 rounded-md ${
              isColoredNote 
                ? 'bg-white/50 dark:bg-black/20 border border-gray-300/50 dark:border-gray-600/50 placeholder:text-gray-600' 
                : 'bg-muted/50 border border-border placeholder:text-muted-foreground'
            }`}
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('notes.takeNote')}
            className={`focus-visible:ring-0 resize-none min-h-[100px] px-2 py-1 rounded-md ${
              isColoredNote 
                ? 'bg-white/50 dark:bg-black/20 border border-gray-300/50 dark:border-gray-600/50 placeholder:text-gray-600' 
                : 'bg-muted/50 border border-border placeholder:text-muted-foreground'
            }`}
            autoFocus
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
                    {NOTE_COLORS.map((noteColor) => (
                      <button
                        key={noteColor.value}
                        onClick={() => setColor(noteColor.value)}
                        className={`h-8 w-8 rounded-full border-2 ${
                          color === noteColor.value
                            ? 'border-primary'
                            : 'border-transparent'
                        } hover:border-muted-foreground transition-colors ${noteColor.bgClass}`}
                        aria-label={noteColor.name}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleClose}>
                {t('notes.cancel')}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleCreate}
                disabled={!content.trim()}
              >
                {t('notes.save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

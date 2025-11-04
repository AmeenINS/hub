'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Plus, Palette } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useI18n } from '@/lib/i18n/i18n-context';

const NOTE_COLORS = [
  { name: 'White', value: '#ffffff' },
  { name: 'Red', value: '#f28b82' },
  { name: 'Orange', value: '#fbbc04' },
  { name: 'Yellow', value: '#fff475' },
  { name: 'Green', value: '#ccff90' },
  { name: 'Teal', value: '#a7ffeb' },
  { name: 'Blue', value: '#cbf0f8' },
  { name: 'Purple', value: '#d7aefb' },
  { name: 'Pink', value: '#fdcfe8' },
  { name: 'Gray', value: '#e8eaed' },
];

interface CreateNoteCardProps {
  onCreate: (data: { title: string; content: string; color: string }) => void;
}

export function CreateNoteCard({ onCreate }: CreateNoteCardProps) {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [color, setColor] = React.useState('#ffffff');

  const handleCreate = () => {
    if (content.trim()) {
      onCreate({ title, content, color });
      setTitle('');
      setContent('');
      setColor('#ffffff');
      setIsExpanded(false);
    }
  };

  const handleClose = () => {
    setIsExpanded(false);
    setTitle('');
    setContent('');
    setColor('#ffffff');
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      style={{ backgroundColor: color }}
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
        <div className="p-4 space-y-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('notes.noteTitle')}
            className="border-none bg-transparent focus-visible:ring-0 text-lg font-semibold p-0"
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('notes.takeNote')}
            className="border-none bg-transparent focus-visible:ring-0 resize-none min-h-[100px] p-0"
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
                            ? 'border-black'
                            : 'border-transparent'
                        } hover:border-gray-400 transition-colors`}
                        style={{ backgroundColor: noteColor.value }}
                        title={noteColor.name}
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

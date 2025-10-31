import React, { useState } from 'react';
import { StatisticsDateRange } from '@/contexts/UserPreferencesContext';
import { Button } from '@/components/ui/button';
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
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface StatisticsDateRangeSelectorProps {
  value: StatisticsDateRange;
  onChange: (range: StatisticsDateRange) => void;
}

export default function StatisticsDateRangeSelector({ value, onChange }: StatisticsDateRangeSelectorProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customStart, setCustomStart] = useState<Date | undefined>(
    value.start ? new Date(value.start) : undefined
  );
  const [customEnd, setCustomEnd] = useState<Date | undefined>(
    value.end ? new Date(value.end) : undefined
  );

  const presetLabels: Record<StatisticsDateRange['preset'], string> = {
    all: 'Gesamte Zeit',
    '7days': 'Letzte 7 Tage',
    '30days': 'Letzte 30 Tage',
    '90days': 'Letzte 90 Tage',
    custom: 'Benutzerdefiniert',
  };

  const handlePresetChange = (preset: StatisticsDateRange['preset']) => {
    if (preset === 'custom') {
      setIsCustomOpen(true);
    } else {
      onChange({ preset });
    }
  };

  const handleCustomApply = () => {
    if (customStart) {
      onChange({
        preset: 'custom',
        start: customStart.toISOString(),
        end: customEnd?.toISOString() || new Date().toISOString(),
      });
      setIsCustomOpen(false);
    }
  };

  const getDisplayText = () => {
    if (value.preset === 'custom' && value.start) {
      const start = format(new Date(value.start), 'dd.MM.yyyy', { locale: de });
      const end = value.end ? format(new Date(value.end), 'dd.MM.yyyy', { locale: de }) : 'Heute';
      return `${start} - ${end}`;
    }
    return presetLabels[value.preset];
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            {getDisplayText()}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handlePresetChange('all')}>
            {presetLabels.all}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetChange('7days')}>
            {presetLabels['7days']}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetChange('30days')}>
            {presetLabels['30days']}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetChange('90days')}>
            {presetLabels['90days']}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePresetChange('custom')}>
            {presetLabels.custom}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Custom Date Range Picker Dialog */}
      <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
        <PopoverTrigger asChild>
          <span></span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="end">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Startdatum</label>
              <Calendar
                mode="single"
                selected={customStart}
                onSelect={setCustomStart}
                locale={de}
                className="rounded-md border"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Enddatum (optional)</label>
              <Calendar
                mode="single"
                selected={customEnd}
                onSelect={setCustomEnd}
                locale={de}
                className="rounded-md border"
                disabled={(date) => customStart ? date < customStart : false}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCustomOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCustomApply} disabled={!customStart}>
                Anwenden
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}



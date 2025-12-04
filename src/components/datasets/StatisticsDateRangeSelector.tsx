import React, { useState, useRef, useEffect } from 'react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverTriggerRef = useRef<HTMLButtonElement>(null);
  const [customStart, setCustomStart] = useState<Date | undefined>(
    value.start ? new Date(value.start) : undefined
  );
  const [customEnd, setCustomEnd] = useState<Date | undefined>(
    value.end ? new Date(value.end) : undefined
  );

  // Position the popover trigger to match the button position
  useEffect(() => {
    if (isCustomOpen && buttonRef.current && popoverTriggerRef.current) {
      const updatePosition = () => {
        if (buttonRef.current && popoverTriggerRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          popoverTriggerRef.current.style.position = 'fixed';
          popoverTriggerRef.current.style.left = `${rect.left}px`;
          popoverTriggerRef.current.style.top = `${rect.top}px`;
          popoverTriggerRef.current.style.width = `${rect.width}px`;
          popoverTriggerRef.current.style.height = `${rect.height}px`;
        }
      };
      
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isCustomOpen]);

  const presetLabels: Record<StatisticsDateRange['preset'], string> = {
    all: 'Gesamte Zeit',
    '7days': 'Letzte 7 Tage',
    '30days': 'Letzte 30 Tage',
    '90days': 'Letzte 90 Tage',
    custom: 'Benutzerdefiniert',
  };

  // When selecting a date from the calendar, preserve the existing time portion (if any)
  const mergeDatePreserveTime = (current: Date | undefined, picked: Date | undefined) => {
    if (!picked) return undefined;
    if (!current) return picked;

    const merged = new Date(picked);
    merged.setHours(
      current.getHours(),
      current.getMinutes(),
      current.getSeconds(),
      current.getMilliseconds()
    );
    return merged;
  };

  const handleStartSelect = (date: Date | undefined) => {
    setCustomStart((current) => mergeDatePreserveTime(current, date));
  };

  const handleEndSelect = (date: Date | undefined) => {
    setCustomEnd((current) => mergeDatePreserveTime(current, date));
  };

  // Compare only calendar days when disabling end dates before the start date
  const isEndDateDisabled = (date: Date) => {
    if (!customStart) return false;

    const startDay = new Date(customStart);
    startDay.setHours(0, 0, 0, 0);

    const candidate = new Date(date);
    candidate.setHours(0, 0, 0, 0);

    return candidate < startDay;
  };

  const handlePresetChange = (preset: StatisticsDateRange['preset'], event?: Event) => {
    if (preset === 'custom') {
      // Prevent dropdown from closing immediately
      event?.preventDefault?.();
      // Close dropdown first, then open popover
      setIsDropdownOpen(false);
      // Use setTimeout to ensure dropdown closes before popover opens
      setTimeout(() => {
        setIsCustomOpen(true);
      }, 150);
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
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button ref={buttonRef} variant="outline" className="gap-2">
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
          <DropdownMenuItem 
            onSelect={(e) => {
              e.preventDefault();
              handlePresetChange('custom', e);
            }}
          >
            {presetLabels.custom}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Custom Date Range Picker Dialog */}
      <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen} modal={true}>
        <PopoverTrigger asChild>
          <button 
            ref={popoverTriggerRef}
            className="opacity-0 pointer-events-none" 
            aria-hidden="true"
            style={{ 
              position: 'fixed',
              zIndex: -1,
              visibility: isCustomOpen ? 'visible' : 'hidden'
            }}
          />
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-4" 
          align="end" 
          onOpenAutoFocus={(e) => e.preventDefault()}
          sideOffset={5}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Startdatum</label>
              <Calendar
                mode="single"
                selected={customStart}
                onSelect={handleStartSelect}
                locale={de}
                className="rounded-md border"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Enddatum (optional)</label>
              <Calendar
                mode="single"
                selected={customEnd}
                onSelect={handleEndSelect}
                locale={de}
                className="rounded-md border"
                disabled={isEndDateDisabled}
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



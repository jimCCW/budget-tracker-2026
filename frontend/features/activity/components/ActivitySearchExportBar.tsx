'use client';
import { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

type Props = {
  onSearchChange: (search: string) => void;
  onExport: () => void;
  exporting: boolean;
};

export function ActivitySearchExportBar({
  onSearchChange,
  onExport,
  exporting,
}: Props) {
  const [value, setValue] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => onSearchChange(value), 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className='flex items-center gap-3'>
      <div className='relative flex-1'>
        <i className='pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm' />
        <InputText
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder='Search transactions...'
          className='h-9 w-full rounded-md bg-bg border border-border pl-9 pr-3 text-sm outline-none transition-shadow focus:border-primary focus:ring-[3px] focus:ring-primary/[0.13]'
        />
      </div>
      <Button
        label='Export'
        icon='pi pi-chevron-down'
        iconPos='right'
        onClick={onExport}
        disabled={exporting}
        pt={{
          root: {
            className:
              'flex items-center gap-2 h-9 px-4 rounded-md border border-border text-sm font-semibold text-text hover:bg-raised transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
          },
          icon: { className: 'text-xs' },
        }}
      />
    </div>
  );
}

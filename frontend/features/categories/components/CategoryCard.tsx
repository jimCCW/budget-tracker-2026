'use client';
import { useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import type { MenuItem } from 'primereact/menuitem';
import type { Category } from '@/types/category';

type Props = {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

export function CategoryCard({ category, onEdit, onDelete }: Props) {
  const menuRef = useRef<Menu>(null);
  const menuId = `category-menu-${category.id}`;
  const [menuOpen, setMenuOpen] = useState(false);

  const color = category.color ?? '#6366F1';
  const icon = category.icon ?? 'pi-tag';

  const menuItems: MenuItem[] = [
    {
      label: 'Edit',
      icon: 'pi pi-pencil',
      command: () => onEdit(category),
    },
    {
      label: 'Delete',
      icon: 'pi pi-trash',
      command: () => onDelete(category),
      className: 'text-danger',
    },
  ];

  return (
    <article className='bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow'>
      <div className='flex items-center gap-3'>
        <div
          className='w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white'
          style={{ backgroundColor: color }}
          aria-hidden='true'
        >
          <i className={`pi ${icon} text-lg`} />
        </div>

        <div className='flex-1 min-w-0'>
          <h3 className='text-sm font-bold text-text truncate'>
            {category.name}
          </h3>
          <p className='text-xs text-text-muted mt-0.5'>
            {category.isDefault ? 'Default category' : 'Custom category'}
          </p>
        </div>

        {!category.isDefault && (
          <div className='relative'>
            <Menu
              id={menuId}
              model={menuItems}
              popup
              ref={menuRef}
              onShow={() => setMenuOpen(true)}
              onHide={() => setMenuOpen(false)}
              pt={{
                root: {
                  className:
                    'bg-surface border border-border rounded-lg shadow-lg py-1 min-w-32',
                },
                menuitem: { className: '' },
                action: {
                  className:
                    'w-full text-left px-3 py-2 text-sm text-text hover:bg-border flex items-center gap-2 transition-colors cursor-pointer',
                },
                icon: { className: 'text-xs' },
                label: { className: '' },
              }}
            />
            <Button
              icon='pi pi-ellipsis-v'
              onClick={(e) => menuRef.current?.toggle(e)}
              aria-label='Category options'
              aria-haspopup='menu'
              aria-controls={menuId}
              aria-expanded={menuOpen}
              pt={{
                root: {
                  className:
                    'w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-raised transition-colors',
                },
                icon: { className: 'text-sm' },
              }}
            />
          </div>
        )}
      </div>

      {/* Color accent bar */}
      <div
        aria-hidden='true'
        className='h-1 rounded-full opacity-30'
        style={{ backgroundColor: color }}
      />
    </article>
  );
}

'use client';
import { useState } from 'react';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import { AppShell } from '@/components/AppShell';
import { CategoryCard } from '@/features/categories/components/CategoryCard';
import { CategoryFormModal } from '@/features/categories/components/CategoryFormModal';
import { DeleteConfirmModal } from '@/features/categories/components/DeleteConfirmModal';
import { useCategories } from '@/features/categories/hooks/useCategories';
import type { Category, CategoryType } from '@/types/category';

const TABS: { value: CategoryType; label: string }[] = [
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'INCOME', label: 'Income' },
];

export function CategoriesPage() {
  const { data: categories, isLoading, isError } = useCategories();

  const [activeTab, setActiveTab] = useState<CategoryType>('EXPENSE');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(
    undefined
  );
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  );

  function openCreate() {
    setEditingCategory(undefined);
    setFormOpen(true);
  }

  function openEdit(category: Category) {
    setEditingCategory(category);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingCategory(undefined);
  }

  const visibleDefault =
    categories?.filter((c) => c.isDefault && c.type === activeTab) ?? [];
  const visibleCustom =
    categories?.filter((c) => !c.isDefault && c.type === activeTab) ?? [];

  const totalDefault = categories?.filter((c) => c.isDefault).length ?? 0;
  const totalCustom = categories?.filter((c) => !c.isDefault).length ?? 0;

  return (
    <AppShell title='Categories' subtitle='Manage spending categories'>
      {/* Top bar */}
      <div className='flex items-center justify-between'>
        <p className='text-sm text-text-muted'>
          {isLoading ? '—' : `${totalDefault} default · ${totalCustom} custom`}
        </p>
        <Button
          label='New Category'
          icon='pi pi-plus'
          onClick={openCreate}
          pt={{
            root: {
              className:
                'flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-white text-sm font-semibold hover:bg-primary-strong transition-colors',
            },
            icon: { className: 'text-sm' },
          }}
        />
      </div>

      {/* Expense / Income tabs */}
      <div className='flex bg-bg border border-border rounded-lg p-1 gap-1 w-full sm:w-72'>
        {TABS.map((tab) => (
          <Button
            key={tab.value}
            label={tab.label}
            onClick={() => setActiveTab(tab.value)}
            pt={{
              root: {
                className: `flex-1 h-8 rounded-md text-sm transition-all ${
                  activeTab === tab.value
                    ? 'bg-surface text-text font-bold shadow-sm'
                    : 'text-text-muted font-medium hover:text-text'
                }`,
              },
            }}
          />
        ))}
      </div>

      {/* Error state */}
      {isError && (
        <div
          role='alert'
          className='bg-danger-tint border border-danger/30 rounded-lg p-4 flex gap-3 items-center'
        >
          <i className='pi pi-times-circle text-danger text-lg' aria-hidden='true' />
          <p className='text-sm text-text-muted'>
            Failed to load categories. Please refresh.
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton
              key={i}
              height='5.5rem'
              pt={{
                root: { className: 'rounded-xl' },
              }}
            />
          ))}
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {/* Default categories */}
          <section aria-labelledby='default-categories-heading'>
            <h2
              id='default-categories-heading'
              className='text-[11px] font-bold text-text-dim uppercase tracking-widest mb-3'
            >
              Default categories
            </h2>
            {visibleDefault.length === 0 ? (
              <p className='text-sm text-text-muted py-4'>
                No default {activeTab.toLowerCase()} categories.
              </p>
            ) : (
              <ul className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                {visibleDefault.map((cat) => (
                  <li key={cat.id}>
                    <CategoryCard
                      category={cat}
                      onEdit={openEdit}
                      onDelete={setDeletingCategory}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Custom categories */}
          <section aria-labelledby='custom-categories-heading'>
            <h2
              id='custom-categories-heading'
              className='text-[11px] font-bold text-text-dim uppercase tracking-widest mb-3'
            >
              My categories
            </h2>
            {visibleCustom.length === 0 ? (
              <Button
                onClick={openCreate}
                pt={{
                  root: {
                    className:
                      'w-full border-2 border-dashed border-border-strong rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-text-muted hover:border-primary hover:text-primary transition-colors group',
                  },
                }}
              >
                <div className='w-11 h-11 rounded-xl bg-raised flex items-center justify-center group-hover:bg-primary-tint transition-colors'>
                  <i className='pi pi-plus text-xl' aria-hidden='true' />
                </div>
                <span className='text-sm font-semibold'>
                  Add your first custom {activeTab.toLowerCase()} category
                </span>
              </Button>
            ) : (
              <ul className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                {visibleCustom.map((cat) => (
                  <li key={cat.id}>
                    <CategoryCard
                      category={cat}
                      onEdit={openEdit}
                      onDelete={setDeletingCategory}
                    />
                  </li>
                ))}
                {/* Add new card */}
                <li>
                  <Button
                    onClick={openCreate}
                    pt={{
                      root: {
                        className:
                          'w-full border-2 border-dashed border-border-strong rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-text-muted hover:border-primary hover:text-primary transition-colors min-h-22 group',
                      },
                    }}
                  >
                    <div className='w-9 h-9 rounded-lg bg-raised flex items-center justify-center group-hover:bg-primary-tint transition-colors'>
                      <i className='pi pi-plus text-base' aria-hidden='true' />
                    </div>
                    <span className='text-xs font-semibold'>
                      Add custom category
                    </span>
                  </Button>
                </li>
              </ul>
            )}
          </section>
        </>
      )}

      <CategoryFormModal
        open={formOpen}
        onClose={closeForm}
        category={editingCategory}
        defaultType={editingCategory ? undefined : activeTab}
      />

      <DeleteConfirmModal
        open={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        category={deletingCategory}
      />
    </AppShell>
  );
}

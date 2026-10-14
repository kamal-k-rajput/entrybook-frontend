'use client';

import { useEffect, useState } from 'react';
import { buttonClass, ErrorText, messageOf, PageTitle } from '@/components/merchant/ui';
import { createCategory, listCategories, updateCategory } from '@/lib/merchant';
import type { Category } from '@/lib/types';

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [expenseType, setExpenseType] = useState<'business' | 'personal'>('business');
  const [error, setError] = useState('');

  function load() {
    listCategories().then(setItems).catch((caught: unknown) => setError(messageOf(caught)));
  }

  useEffect(load, []);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    try {
      await createCategory(name.trim(), expenseType);
      setName('');
      load();
    } catch (caught) {
      setError(messageOf(caught));
    }
  }

  return (
    <div>
      <PageTitle title="Categories" text="New shops start with the default personal and business categories." />
      <form onSubmit={add} className="mt-6 flex flex-wrap items-end gap-3">
        <label className="text-sm font-medium">
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} className="mt-1 block rounded-xl border border-[var(--line)] px-3 py-2.5" />
        </label>
        <select value={expenseType} onChange={(event) => setExpenseType(event.target.value as 'business' | 'personal')} className="rounded-xl border border-[var(--line)] px-3 py-2.5">
          <option value="business">Business</option>
          <option value="personal">Personal</option>
        </select>
        <button type="submit" className={buttonClass}>Add</button>
      </form>
      <ErrorText>{error}</ErrorText>
      {(['business', 'personal'] as const).map((type) => (
        <section key={type} className="mt-8">
          <h2 className="font-[family-name:var(--font-display)] text-2xl capitalize">{type}</h2>
          <ul className="mt-3 divide-y divide-[var(--line)]">
            {items.filter((item) => item.expenseType === type).map((category) => (
              <li key={category.id} className="flex items-center justify-between py-3 text-sm">
                <span>{category.name} {category.active ? '' : '· inactive'}</span>
                <button
                  type="button"
                  className="text-[var(--green)]"
                  onClick={() => updateCategory(category.id, { active: !category.active }).then(load).catch((caught: unknown) => setError(messageOf(caught)))}
                >
                  {category.active ? 'Deactivate' : 'Activate'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

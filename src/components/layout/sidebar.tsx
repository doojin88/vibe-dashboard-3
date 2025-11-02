'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';
import { MENU_ITEMS, type MenuItem } from '@/lib/navigation/menu-config';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function Sidebar() {
  const pathname = usePathname();
  const { data: role } = useUserRole();

  const visibleItems = MENU_ITEMS.filter(
    (item) => !item.role || item.role === role
  );

  return (
    <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-64 overflow-y-auto border-r bg-background">
      <nav className="flex flex-col gap-2 p-4">
        {visibleItems.map((item) => (
          <MenuItemComponent key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>
    </aside>
  );
}

function MenuItemComponent({ item, pathname }: { item: MenuItem; pathname: string }) {
  const [isOpen, setIsOpen] = useState(pathname.startsWith(item.href));

  if (item.children) {
    return (
      <Accordion type="single" collapsible value={isOpen ? item.href : ''}>
        <AccordionItem value={item.href} className="border-none">
          <AccordionTrigger
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:no-underline',
              pathname.startsWith(item.href) && 'bg-accent'
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="flex-1 text-left">{item.title}</span>
          </AccordionTrigger>
          <AccordionContent className="pl-6 pt-1 pb-0">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent',
                  pathname === child.href && 'bg-accent font-medium'
                )}
              >
                <child.icon className="h-4 w-4" />
                <span>{child.title}</span>
              </Link>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent',
        pathname === item.href && 'bg-accent'
      )}
    >
      <item.icon className="h-4 w-4" />
      <span>{item.title}</span>
    </Link>
  );
}

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { COMPANY_URL, GITHUB_REPO_URL } from '@/constants/links';
import { useDarkMode } from '@/hooks/useDarkMode';
import { Github, Moon, Sun } from 'lucide-react';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AppSidebar } from './AppSidebar';
import { LanguageSwitcher } from './LanguageSwitcher';
import { PageBreadcrumb } from './PageBreadcrumb';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

interface DashboardLayoutProps {
  children: ReactNode;
  breadcrumbItems?: Array<{ label: string; href?: string }>;
}

export function DashboardLayout({ children, breadcrumbItems }: DashboardLayoutProps) {
  const { t } = useTranslation();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className='min-h-svh'>
        <header className='sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:h-16 md:px-4'>
          <SidebarTrigger className='-ml-1' />
          <Separator orientation='vertical' className='mr-1 h-4' />
          <PageBreadcrumb items={breadcrumbItems} />
          <div className='ml-auto flex items-center gap-1'>
            <LanguageSwitcher />
            <Button variant='ghost' size='icon' asChild className='h-8 w-8'>
              <a
                href={GITHUB_REPO_URL}
                target='_blank'
                rel='noopener noreferrer'
                aria-label={t('header.github')}
                title={t('header.github')}
              >
                <Github className='h-4 w-4' />
              </a>
            </Button>
            <Button
              variant='ghost'
              size='icon'
              onClick={toggleDarkMode}
              className='h-8 w-8'
              aria-label={t('header.toggleTheme')}
              title={t('header.toggleTheme')}
            >
              {isDarkMode ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
            </Button>
          </div>
        </header>
        <div className='flex flex-1 flex-col gap-4 p-3 md:p-6'>{children}</div>
        <AppFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}

function AppFooter() {
  const { t } = useTranslation();
  return (
    <footer className='border-t px-3 py-4 text-xs text-muted-foreground md:px-6'>
      <div className='flex flex-col items-center justify-between gap-2 sm:flex-row'>
        <p>{t('footer.rights', { year: new Date().getFullYear() })}</p>
        <div className='flex items-center gap-4'>
          <a href={COMPANY_URL} target='_blank' rel='noopener noreferrer' className='hover:text-foreground'>
            {t('footer.website')}
          </a>
          <a href={GITHUB_REPO_URL} target='_blank' rel='noopener noreferrer' className='hover:text-foreground'>
            {t('footer.openSource')}
          </a>
        </div>
      </div>
    </footer>
  );
}

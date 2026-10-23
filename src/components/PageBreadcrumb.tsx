import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Fragment } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

interface BreadcrumbEntry {
  label: string
  href?: string
}

interface PageBreadcrumbProps {
  /** Trail after the dashboard root; omit on the dashboard itself. */
  items?: BreadcrumbEntry[]
}

export function PageBreadcrumb({ items = [] }: PageBreadcrumbProps) {
  const { t } = useTranslation()
  const breadcrumbs: BreadcrumbEntry[] = [
    { label: t("nav.dashboard"), href: items.length ? "/" : undefined },
    ...items,
  ]

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {breadcrumbs.map((item, index) => (
          <Fragment key={index}>
            <BreadcrumbItem className="min-w-0">
              {item.href ? (
                <BreadcrumbLink asChild>
                  <Link to={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="truncate">{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useBackendAuth, useChargePoints, useOrganizations, useZones } from '@/features/backend/hooks'
import type { BackendChargePoint } from '@/features/backend/types'
import { importFromBackend } from '@/features/ocpp/ocppSlice'
import { showToast } from '@/lib/toast'
import type { RootState } from '@/store/store'
import { ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BackendBrowserSheet({ open, onOpenChange }: Props) {
  const dispatch = useDispatch()
  const { activeOrgId } = useBackendAuth()
  const { organizations, isLoading: orgsLoading } = useOrganizations()
  const [selectedOrgId, setSelectedOrgId] = useState<string>()

  // Default: the active org if listed, otherwise the only available one.
  const orgId =
    selectedOrgId ??
    organizations.find((o) => o.id === activeOrgId)?.id ??
    (organizations.length === 1 ? organizations[0].id : undefined)
  const org = organizations.find((o) => o.id === orgId)

  const zonesQuery = useZones(orgId)
  const chargersQuery = useChargePoints(orgId)
  const items = useSelector((s: RootState) => s.ocpp.items)
  const importedIds = useMemo(
    () => new Set(Object.values(items).map((cp) => cp.backend?.chargePointId)),
    [items]
  )

  const byZone = useMemo(() => {
    const map = new Map<string, BackendChargePoint[]>()
    for (const cp of chargersQuery.data ?? []) map.set(cp.zoneId, [...(map.get(cp.zoneId) ?? []), cp])
    return map
  }, [chargersQuery.data])

  const error = zonesQuery.error ?? chargersQuery.error

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full sm:max-w-2xl overflow-y-auto'>
        <SheetHeader>
          <SheetTitle>Backend chargers</SheetTitle>
          <SheetDescription>
            Import a charger to simulate it: its EVSE ID becomes the OCPP charge point ID.
          </SheetDescription>
        </SheetHeader>

        <div className='grid gap-4 p-4'>
          <div className='grid gap-1'>
            <span className='text-sm font-medium'>Organization</span>
            <Select value={orgId ?? ''} onValueChange={setSelectedOrgId} disabled={orgsLoading}>
              <SelectTrigger aria-label='Organization'>
                <SelectValue placeholder={orgsLoading ? 'Loading...' : 'Select an organization'} />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p role='alert' className='text-sm text-destructive'>
              Could not load data from the backend.
            </p>
          )}
          {orgId && (zonesQuery.isLoading || chargersQuery.isLoading) && (
            <p className='text-sm text-muted-foreground'>Loading...</p>
          )}
          {zonesQuery.data?.length === 0 && (
            <p className='text-sm text-muted-foreground'>This organization has no zones.</p>
          )}

          {org &&
            zonesQuery.data?.map((zone) => {
              const list = byZone.get(zone.id) ?? []
              return (
                <Collapsible key={zone.id} defaultOpen className='rounded-md border'>
                  <CollapsibleTrigger className='flex w-full items-center justify-between px-3 py-2 text-left'>
                    <span className='font-medium'>{zone.name}</span>
                    <span className='flex items-center gap-2 text-xs text-muted-foreground'>
                      {list.length} charger{list.length === 1 ? '' : 's'}
                      <ChevronDown className='h-4 w-4' />
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {list.length === 0 ? (
                      <p className='px-3 pb-3 text-sm text-muted-foreground'>No chargers in this zone</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>EVSE ID</TableHead>
                            <TableHead>Connectors</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {list.map((cp) => (
                            <TableRow key={cp.id}>
                              <TableCell>{cp.name}</TableCell>
                              <TableCell className='font-mono text-xs'>{cp.evseId}</TableCell>
                              <TableCell>{cp.connectors.length}</TableCell>
                              <TableCell>
                                <Badge variant='outline'>{cp.status}</Badge>
                              </TableCell>
                              <TableCell className='text-right'>
                                {importedIds.has(cp.id) ? (
                                  <span className='text-xs text-muted-foreground'>Imported</span>
                                ) : (
                                  <Button
                                    size='sm'
                                    onClick={() => {
                                      dispatch(importFromBackend(cp, org, zone))
                                      showToast.success(`${cp.name} imported as ${cp.evseId}`)
                                    }}
                                  >
                                    Import
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
        </div>
      </SheetContent>
    </Sheet>
  )
}

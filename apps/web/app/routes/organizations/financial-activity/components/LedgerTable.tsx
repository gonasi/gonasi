import { useState } from 'react';
import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

import type { LedgerEntry } from '@gonasi/database/financialActivity';

import { TransactionTypeBadge } from './TransactionTypeBadge';

import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { cn } from '~/lib/utils';

type ParsedMetadata = Record<string, any>;

interface LedgerTableProps {
  entries: LedgerEntry[];
}

export const LedgerTable = ({ entries }: LedgerTableProps) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })}`;
  };

  return (
    <div className='border-input overflow-hidden rounded-none border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[50px]' />
            <TableHead>Type</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const isExpanded = expandedRow === entry.id;
            const metadata = (entry.metadata ?? {}) as ParsedMetadata;

            return (
              <>
                <TableRow
                  key={entry.id}
                  className={cn('cursor-pointer', isExpanded && 'bg-muted/50')}
                  onClick={() => toggleRow(entry.id)}
                >
                  <TableCell>
                    <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                      {isExpanded ? (
                        <ChevronUp className='h-4 w-4' />
                      ) : (
                        <ChevronDown className='h-4 w-4' />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <TransactionTypeBadge type={entry.type} />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant='outline'
                      className={cn(
                        'font-medium',
                        entry.direction === 'credit'
                          ? 'bg-credit-light text-credit border-credit/20'
                          : 'bg-debit-light text-debit border-debit/20',
                      )}
                    >
                      {entry.direction === 'credit' ? (
                        <ArrowDownLeft className='mr-1 h-3 w-3' />
                      ) : (
                        <ArrowUpRight className='mr-1 h-3 w-3' />
                      )}
                      {entry.direction}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'font-semibold',
                        entry.direction === 'credit' ? 'text-success' : 'text-debit',
                      )}
                    >
                      {formatAmount(entry.amount, entry.currency_code)}
                    </span>
                  </TableCell>
                  <TableCell className='font-medium'>{entry.source_wallet_type}</TableCell>
                  <TableCell className='font-medium'>{entry.destination_wallet_type}</TableCell>
                  <TableCell>
                    <Badge variant='secondary' className='capitalize'>
                      {entry.status}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-sm'>
                    {format(new Date(entry.created_at), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                </TableRow>

                {isExpanded && (
                  <TableRow key={`${entry.id}-expanded`}>
                    <TableCell colSpan={8} className='bg-muted/30 p-6'>
                      <div className='space-y-4'>
                        <div className='grid grid-cols-1 gap-4 text-sm md:grid-cols-2'>
                          <div>
                            <span className='text-muted-foreground font-medium'>
                              Transaction ID
                            </span>
                            <p className='mt-1 font-mono text-xs break-all'>{entry.id}</p>
                          </div>
                          <div>
                            <span className='text-muted-foreground font-medium'>Reference</span>
                            <p className='mt-1 font-mono text-xs break-all'>
                              {entry.payment_reference}
                            </p>
                          </div>
                          <div>
                            <span className='text-muted-foreground font-medium'>
                              Related Entity
                            </span>
                            <p className='mt-1'>
                              {entry.related_entity_type}{' '}
                              {entry.related_entity_id && (
                                <span className='text-muted-foreground font-mono text-xs'>
                                  ({entry.related_entity_id.slice(0, 8)}...)
                                </span>
                              )}
                            </p>
                          </div>
                          {entry.source_wallet_id && (
                            <div>
                              <span className='text-muted-foreground font-medium'>
                                Source Wallet
                              </span>
                              <p className='mt-1 font-mono text-xs break-all'>
                                {entry.source_wallet_id}
                              </p>
                            </div>
                          )}
                        </div>

                        {metadata.description && (
                          <div>
                            <span className='text-muted-foreground text-sm font-medium'>
                              Description
                            </span>
                            <p className='mt-1 text-sm'>{metadata.description}</p>
                          </div>
                        )}

                        <div>
                          <div className='mb-2 flex items-center justify-between'>
                            <span className='text-muted-foreground text-sm font-medium'>
                              Metadata
                            </span>
                            {metadata.paystack_transaction_id && (
                              <Badge variant='outline' className='gap-1'>
                                Paystack #{metadata.paystack_transaction_id}
                                <ExternalLink className='h-3 w-3' />
                              </Badge>
                            )}
                          </div>
                          <div className='bg-card max-h-64 overflow-auto rounded-md p-3'>
                            <pre className='font-mono text-xs break-all whitespace-pre-wrap'>
                              {JSON.stringify(metadata, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

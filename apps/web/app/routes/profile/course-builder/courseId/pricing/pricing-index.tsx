import { BannerCard } from '~/components/cards';
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';

export default function CoursePricing() {
  return (
    <div className='mx-auto max-w-2xl'>
      <BannerCard
        message='Your new prices go live instantly, no need to hit publish!'
        description='Just updating the price? It updates right away. Only content changes need publishing.'
        variant='info'
        className='mb-10'
      />

      <Table>
        <TableCaption>A list of your recent invoices.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Promotion</TableHead>
            <TableHead>Flags</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody />
      </Table>
    </div>
  );
}

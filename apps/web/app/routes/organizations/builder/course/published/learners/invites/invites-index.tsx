import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card/card';

export function meta() {
  return [
    { title: 'Invites • Gonasi' },
    { name: 'description', content: 'Manage learner invitations for this course' },
  ];
}

export default function InvitesIndex() {
  return (
    <div className='flex flex-col gap-6'>
      <Card className='rounded-none'>
        <CardHeader>
          <CardTitle>Invites</CardTitle>
          <CardDescription>
            Send and manage course invitations to new learners
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center justify-center py-12'>
            <p className='text-muted-foreground'>Invite management coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

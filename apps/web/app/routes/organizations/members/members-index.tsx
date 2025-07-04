import { Button } from '~/components/ui/button';

export default function MembersIndex() {
  return (
    <section className='p-4'>
      <div className='flex items-center justify-between'>
        <h2>Team Members</h2>
        <Button>Invite Member</Button>
      </div>
    </section>
  );
}

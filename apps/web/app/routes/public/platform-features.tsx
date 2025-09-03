import { useState } from 'react';

interface Feature {
  name: string;
  done: boolean;
}
interface Category {
  category: string;
  items: Feature[];
}

export default function FeaturesPage() {
  const features: Category[] = [
    {
      category: 'Authentication & User Management',
      items: [
        { name: 'Sign up', done: true },
        { name: 'Log in', done: true },
        { name: 'Google Auth', done: false },
        { name: 'Password reset', done: false },
        { name: 'User profiles with learning progress', done: false },
        { name: 'Learner achievement badges', done: false },
      ],
    },
    {
      category: 'Organizations & Collaboration',
      items: [
        { name: 'Create organizations', done: true },
        { name: 'Add organization members', done: true },
        { name: 'Manage roles & permissions', done: true },
        { name: 'Invite members via email', done: true },
        { name: 'Organization tier limits', done: false },
        { name: 'Transfer organization ownership', done: false },
        { name: 'Upgrade/downgrade organization tier', done: false },
        { name: 'Withdraw organization funds', done: false },
        { name: 'Organization branded profiles', done: false },
        { name: 'Multi-collaborator course creation', done: false },
        { name: 'Organization workspace dashboard', done: false },
        { name: 'Member activity tracking', done: false },
      ],
    },
    {
      category: 'Course Creation & Management',
      items: [
        { name: 'Create, update, delete courses', done: true },
        { name: 'Course editor (blocks, quizzes, etc.)', done: true },
        { name: 'Publish courses (public & private)', done: true },
        { name: 'Invite users to private courses', done: false },
        { name: 'Enroll in public courses', done: true },
        { name: 'Course pricing tiers', done: true },
        { name: 'Promotional pricing', done: true },
        { name: 'Subscriptions & payment plans', done: false },
        { name: 'Course analytics (progress, revenue, etc.)', done: false },
        { name: 'Gamified course elements', done: false },
        { name: 'Bite-sized lesson chunks', done: false },
        { name: 'Interactive challenges & assessments', done: false },
        { name: 'Course templates for quick creation', done: false },
        { name: 'Collaborative course editing', done: false },
        { name: 'Course version control', done: false },
      ],
    },
    {
      category: 'Learning Experience',
      items: [
        { name: 'Interactive course player', done: true },
        { name: 'Progress tracking & completion', done: true },
        { name: 'Gamification elements (points, levels)', done: true },
        { name: 'Learning streaks & motivation', done: false },
        { name: 'Course reviews & ratings', done: false },
        { name: 'Discussion forums per course', done: false },
        { name: 'Offline course access', done: false },
        { name: 'Mobile-optimized learning', done: true },
      ],
    },
    {
      category: 'Live & Real-time Features',
      items: [
        { name: 'Live trivia sessions', done: false },
        { name: 'Real-time quiz competitions', done: false },
        { name: 'Live leaderboards during events', done: false },
        { name: 'Synchronized group learning sessions', done: false },
        { name: 'Live Q&A with instructors', done: false },
        { name: 'Real-time polls and surveys', done: false },
        { name: 'Live study groups/rooms', done: false },
        { name: 'Scheduled trivia tournaments', done: false },
        { name: 'Live course launches/premieres', done: false },
        { name: 'Real-time collaboration on challenges', done: false },
        { name: 'Live instructor-led workshops', done: false },
        { name: 'Multiplayer learning challenges', done: false },
        { name: 'Live streaming integration', done: false },
        { name: 'Real-time feedback during lessons', done: false },
        { name: 'Live cohort-based courses', done: false },
      ],
    },
    {
      category: 'Monetization & Payments',
      items: [
        { name: 'Direct course sales', done: true },
        { name: 'Local payment methods integration', done: true },
        { name: 'Revenue sharing system', done: true },
        { name: 'Automatic payout processing', done: false },
        { name: 'Sales analytics & reporting', done: false },
        { name: 'Discount codes & coupons', done: false },
        { name: 'Bulk purchase options', done: false },
        { name: 'Refund management', done: false },
      ],
    },
    {
      category: 'Course Discovery & Promotion',
      items: [
        { name: 'Course marketplace/catalog', done: false },
        { name: 'Search & filtering system', done: false },
        { name: 'Featured courses section', done: false },
        { name: 'Paid course promotion', done: false },
        { name: 'Course recommendation engine', done: false },
        { name: 'Category-based browsing', done: false },
        { name: 'Trending courses dashboard', done: false },
        { name: 'Course preview functionality', done: false },
      ],
    },
    {
      category: 'Analytics & Insights',
      items: [
        { name: 'Organization dashboard analytics', done: false },
        { name: 'Course performance metrics', done: false },
        { name: 'Learner engagement tracking', done: false },
        { name: 'Revenue analytics', done: false },
        { name: 'Completion rate insights', done: false },
        { name: 'A/B testing for course content', done: false },
        { name: 'Export analytics reports', done: false },
      ],
    },
    {
      category: 'Platform Management',
      items: [
        { name: 'Tier-based storage limits', done: true },
        { name: 'Organization member limits', done: true },
        { name: 'Free course quotas per tier', done: true },
        { name: 'Content moderation tools', done: false },
        { name: 'Admin dashboard', done: false },
        { name: 'Platform-wide notifications', done: false },
        { name: 'API for integrations', done: false },
        { name: 'White-label options', done: false },
      ],
    },
    {
      category: 'Communication & Support',
      items: [
        { name: 'Email notifications system', done: false },
        { name: 'In-app messaging', done: false },
        { name: 'Course announcements', done: false },
        { name: 'Help center & documentation', done: false },
        { name: 'Live chat support', done: false },
        { name: 'Community forums', done: false },
      ],
    },
  ];

  const Accordion = ({ group }: { group: Category }) => {
    const [open, setOpen] = useState(false);
    const allDone = group.items.every((f) => f.done);

    return (
      <div className='border-border/80 bg-card rounded-sm border hover:cursor-pointer'>
        <button
          onClick={() => setOpen(!open)}
          className='flex w-full items-center justify-between px-4 py-3 text-left hover:cursor-pointer'
        >
          <span className='font-semibold'>{group.category}</span>
          <span
            className={`ml-2 rounded-full px-2 py-1 text-sm ${
              allDone ? 'bg-success text-success-foreground' : 'bg-background text-foreground'
            }`}
          >
            {allDone
              ? '✓ All done'
              : `${group.items.filter((f) => f.done).length}/${group.items.length}`}
          </span>
        </button>

        {open && (
          <ul className='space-y-3 px-6 pb-4'>
            {group.items.map((feature, i) => (
              <li key={i} className='flex items-center'>
                <span
                  className={`mr-3 flex h-5 w-5 items-center justify-center rounded-full ${
                    feature.done
                      ? 'bg-success text-success-foreground'
                      : 'bg-background text-foreground'
                  }`}
                >
                  {feature.done ? '✓' : '✗'}
                </span>
                <span
                  className={`font-secondary ${feature.done ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  {feature.name}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <section className='mx-auto w-full max-w-4xl space-y-4 p-6'>
      <h1 className='mb-4 text-2xl font-bold'>Developed Features</h1>
      {features.map((group, idx) => (
        <Accordion key={idx} group={group} />
      ))}
    </section>
  );
}

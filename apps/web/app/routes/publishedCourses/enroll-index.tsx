import { useOutletContext } from 'react-router';
import { GraduationCap } from 'lucide-react';

import type { Route } from './+types/enroll-index';
import type { CoursePricingDataType } from '../public/published-course-id-index';

import { PricingOptionCard } from '~/components/cards/go-course-card/PricingOptionCard';
import { Button } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';

interface CoursePricingContextType {
  name: string;
  pricingData: CoursePricingDataType[];
}

export default function EnrollIndex({ params }: Route.ComponentProps) {
  const { name, pricingData } = useOutletContext<CoursePricingContextType>();
  const courseId = params.publishedCourseId;

  const filteredPricingData = pricingData.find((item) => item.id === params.pricingTierId);

  if (!filteredPricingData) {
    return (
      <Modal open>
        <Modal.Content size='md'>
          <Modal.Header title='Pricing Tier Not Found' />
          <Modal.Body>
            <p>No pricing tier matches the given ID.</p>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    );
  }

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header title={`Enroll to ${name}`} closeRoute={`/c/${courseId}`} />
        <Modal.Body className='px-0 md:px-4'>
          <PricingOptionCard pricingData={filteredPricingData} hideContinueButton />
          <div className='pt-6 pb-2'>
            <Button leftIcon={<GraduationCap />}>Enroll</Button>
          </div>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

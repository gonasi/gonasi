import { Outlet, useLocation, useNavigate, useOutletContext, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';

import { PlainButton } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { Stepper } from '~/components/ui/stepper';
import type { CourseOverviewType } from '~/routes/dashboard/courses/course-by-id';

export function meta() {
  return [{ title: 'Gonasi' }, { name: 'description', content: 'Welcome to Gonasi' }];
}

export default function UpsertCourseLayout() {
  const courseDetails = useOutletContext<CourseOverviewType>() ?? {};

  const navigate = useNavigate();

  const location = useLocation();
  const params = useParams();

  const steps = [
    { id: 'edit-category', title: 'Category', path: 'edit-category' },
    { id: 'edit-subcategory', title: 'Subcategory', path: 'edit-subcategory' },
    { id: 'edit-pathway', title: 'Pathway', path: 'edit-pathway' },
  ];

  const currentStepIndex = steps.length
    ? Math.max(
        steps.findIndex((step) => location.pathname.endsWith(step.path)),
        0,
      )
    : 0;

  const handleBack = () => {
    if (currentStepIndex > 0) {
      const prevStep = steps[currentStepIndex - 1];
      if (prevStep) {
        navigate(
          `/dashboard/${params.companyId}/courses/${params.courseId}/grouping/${prevStep.path}`,
        );
      }
    }
  };

  const handleClose = () =>
    navigate(`/dashboard/${params.companyId}/courses/${params.courseId}/course-details`);

  return (
    <Modal open onOpenChange={(open) => open || handleClose()}>
      <Modal.Content size='sm'>
        <Modal.Header
          title='Course grouping'
          leadingIcon={
            currentStepIndex > 0 && (
              <PlainButton onClick={handleBack} className='mr-2 md:mr-4'>
                <ArrowLeft />
              </PlainButton>
            )
          }
        />
        <Modal.Body>
          <div className='pb-8'>
            {steps.length > 0 && <Stepper steps={steps} currentStepIndex={currentStepIndex} />}
          </div>
          <Outlet context={courseDetails} />
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
}

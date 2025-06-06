import { Outlet, useLocation, useOutletContext, useParams } from 'react-router';

import { BackArrowNavLink } from '~/components/ui/button';
import { Modal } from '~/components/ui/modal';
import { Stepper } from '~/components/ui/stepper';
import type { CourseOverviewType } from '~/routes/profile/course-builder/courseId/course-id-index';

export default function UpsertCourseLayout() {
  const courseDetails = useOutletContext<CourseOverviewType>() ?? {};

  const location = useLocation();
  const params = useParams();

  const steps = [
    { id: 'edit-category', title: 'Pick a category', path: 'edit-category' },
    { id: 'edit-subcategory', title: 'Choose a subcategory', path: 'edit-subcategory' },
    { id: 'edit-pathway', title: 'Set the learning path', path: 'edit-pathway' },
  ];

  const currentStepIndex = steps.length
    ? Math.max(
        steps.findIndex((step) => location.pathname.endsWith(step.path)),
        0,
      )
    : 0;

  const getBackUrl = () => {
    if (currentStepIndex > 0) {
      const prevStep = steps[currentStepIndex - 1];
      if (prevStep) {
        return `/${params.username}/course-builder/${params.courseId}/overview/grouping/${prevStep.path}`;
      }
    }
    return '';
  };

  return (
    <Modal open>
      <Modal.Content size='md'>
        <Modal.Header
          title='Let’s group your course'
          closeRoute={`/${params.username}/course-builder/${params.courseId}/overview`}
          leadingIcon={
            currentStepIndex > 0 && <BackArrowNavLink to={getBackUrl()} className='mr-2 md:mr-4' />
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

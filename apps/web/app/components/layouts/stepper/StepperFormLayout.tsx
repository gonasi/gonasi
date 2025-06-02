import type { PropsWithChildren } from 'react';
import { NavLink, useLocation, useNavigate, useParams } from 'react-router';
import { ArrowLeft, X } from 'lucide-react';

import { AppLogo } from '~/components/app-logo';
import { PlainButton } from '~/components/ui/button/PlainButton';
import { Stepper } from '~/components/ui/stepper';

interface Step {
  id: string;
  title: string;
  path: string;
}

interface Props extends PropsWithChildren {
  username: string;
  steps?: Step[];
  closeLink: string;
  desktopTitle?: string;
  mobileTitle?: string;
}

export function StepperFormLayout({
  username,
  steps = [],
  children,
  closeLink,
  desktopTitle,
  mobileTitle,
}: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { 0: dynamicParam } = useParams();

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
        navigate(`/dashboard/${username}/courses/${dynamicParam}/${prevStep.path}`);
      }
    }
  };

  return (
    <div className='flex flex-col space-y-4 p-4 md:space-y-8'>
      <div className='hidden w-full items-center justify-center md:flex'>
        <AppLogo />
      </div>
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>
          {currentStepIndex > 0 && (
            <PlainButton onClick={handleBack} className='mr-2 md:mr-4'>
              <ArrowLeft />
            </PlainButton>
          )}
          <div>
            {desktopTitle ? (
              <h3 className='text-header hidden text-lg md:flex md:text-2xl'>{desktopTitle}</h3>
            ) : null}
            {mobileTitle ? (
              <h3 className='text-header flex text-lg md:hidden md:text-2xl'>{mobileTitle}</h3>
            ) : null}
          </div>
        </div>
        <NavLink to={closeLink}>
          <X />
        </NavLink>
      </div>
      {steps.length > 0 && <Stepper steps={steps} currentStepIndex={currentStepIndex} />}
      <div className='border-card rounded-md border-0 px-0 py-4 shadow-none md:border md:px-4 md:py-8'>
        {children}
      </div>
    </div>
  );
}

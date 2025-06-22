import type { PropsWithChildren } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';

import { AppLogo } from '~/components/app-logo';
import { NavLinkButton } from '~/components/ui/button';
import { PlainButton } from '~/components/ui/button/PlainButton';
import { Stepper } from '~/components/ui/stepper';

interface Step {
  id: string;
  title: string;
  path: string;
}

type Props = PropsWithChildren<{ steps?: Step[] }>;

export function OnboardingStepperFormLayout({ steps, children }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  const dynamicParam = Object.values(params)[0];

  const currentStepIndex = steps?.length
    ? Math.max(
        steps.findIndex((step) => location.pathname.endsWith(step.path)),
        0,
      )
    : 0;

  const handleBack = () => {
    if (steps?.length && currentStepIndex > 0) {
      const prevStep = steps[currentStepIndex - 1];
      if (!prevStep) return;
      navigate(`/go/onboarding/${dynamicParam}/${prevStep.path}`);
    }
  };

  return (
    <div className='flex flex-col space-y-4 p-4 md:space-y-8'>
      <div className='grid grid-cols-3 items-center pb-4'>
        <div>
          {steps?.length && currentStepIndex > 0 && (
            <PlainButton onClick={handleBack} className='justify-self-start'>
              <ArrowLeft />
            </PlainButton>
          )}
        </div>
        <div className='justify-self-center'>
          <AppLogo />
        </div>
        <div className='justify-self-end'>
          <NavLinkButton to='/signout'>Sign Out</NavLinkButton>
        </div>
      </div>
      {steps?.length && <Stepper steps={steps} currentStepIndex={currentStepIndex} />}
      <div className='border-card rounded-md border px-4 py-8 shadow-none'>
        <div>{children}</div>
      </div>
    </div>
  );
}

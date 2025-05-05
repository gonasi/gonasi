import { useCallback, useEffect, useState } from 'react';
import { useFetcher, useParams } from 'react-router';

import type { NodeProgressMap, TapToRevealNodePayload } from '@gonasi/database/lessons';

import { ContinueButton } from '../ContinueButton';

import { useStore } from '~/store';

interface TapToRevealActionsProps {
  uuid: string;
}

export function TapToRevealActions({ uuid }: TapToRevealActionsProps) {
  const { optimisticallyUpdateNodeProgress } = useStore();

  const [loading, setLoading] = useState(false);

  const fetcher = useFetcher();
  const params = useParams();

  useEffect(() => {
    setLoading(fetcher.state === 'submitting');
  }, [fetcher.state]);

  const handleContinue = useCallback(() => {
    const formData = new FormData();

    const payload: TapToRevealNodePayload = {
      uuid,
      nodeType: 'tap-to-reveal',
      isPlayed: true,
      timestamp: new Date().toISOString(),
    };

    formData.append('intent', 'addGoInteractive');
    formData.append('payload', JSON.stringify(payload));

    // Cast to unknown first and then to the target type to satisfy TypeScript
    const progressUpdate = {
      [uuid]: {
        type: 'tap-to-reveal' as const,
        payload,
      },
    } as unknown as Partial<NodeProgressMap>;

    // Optimistic update in Zustand store
    optimisticallyUpdateNodeProgress(progressUpdate);

    fetcher.submit(formData, {
      method: 'post',
      action: `/go/course/${params.courseId}/${params.chapterId}/${params.lessonId}/api-interactive`,
    });
  }, [
    uuid,
    optimisticallyUpdateNodeProgress,
    fetcher,
    params.courseId,
    params.chapterId,
    params.lessonId,
  ]);

  return <ContinueButton onClick={handleContinue} loading={loading} />;
}

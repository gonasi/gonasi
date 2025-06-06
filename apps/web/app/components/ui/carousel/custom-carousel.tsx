import * as React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { OutlineButton } from '~/components/ui/button';
import { cn } from '~/lib/utils';

interface CarouselProps {
  opts?: any;
  plugins?: any;
  orientation?: 'horizontal' | 'vertical';
  setApi?: (api: any) => void;
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  selectedIndex: number;
  scrollTo: (index: number) => void;
  opts?: any;
} & CarouselProps;

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) {
    throw new Error('useCarousel must be used within a <Carousel />');
  }
  return context;
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(({ orientation = 'horizontal', opts, setApi, plugins, className, children, ...props }, ref) => {
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === 'horizontal' ? 'x' : 'y',
    },
    plugins,
  );
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const onSelect = React.useCallback((api: any) => {
    if (!api) {
      return;
    }

    setSelectedIndex(api.selectedScrollSnap());
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = React.useCallback(() => {
    api?.scrollNext();
  }, [api]);

  const scrollTo = React.useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api],
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext],
  );

  React.useEffect(() => {
    if (!api || !setApi) {
      return;
    }

    setApi(api);
  }, [api, setApi]);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    onSelect(api);
    api.on('reInit', onSelect);
    api.on('select', onSelect);

    return () => {
      api?.off('select', onSelect);
    };
  }, [api, onSelect]);

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api,
        opts,
        orientation,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
        selectedIndex,
        scrollTo,
      }}
    >
      <div
        ref={ref}
        onKeyDownCapture={handleKeyDown}
        className={cn('relative', className)}
        role='region'
        aria-roledescription='carousel'
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
});
Carousel.displayName = 'Carousel';

const CarouselContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { carouselRef, orientation } = useCarousel();

    return (
      <div ref={carouselRef} className='overflow-hidden'>
        <div
          ref={ref}
          className={cn(
            'flex',
            orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col',
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
CarouselContent.displayName = 'CarouselContent';

const CarouselItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { orientation } = useCarousel();

    return (
      <div
        ref={ref}
        role='group'
        aria-roledescription='slide'
        className={cn(
          'min-w-0 shrink-0 grow-0 basis-full',
          orientation === 'horizontal' ? 'pl-4' : 'pt-4',
          className,
        )}
        {...props}
      />
    );
  },
);
CarouselItem.displayName = 'CarouselItem';

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof OutlineButton>
>(({ className, size = 'icon', ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  return (
    <OutlineButton
      ref={ref}
      size={size}
      className={cn(
        'h-8 w-8 rounded-full',

        className,
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ChevronLeft className='h-4 w-4' />
      <span className='sr-only'>Previous slide</span>
    </OutlineButton>
  );
});
CarouselPrevious.displayName = 'CarouselPrevious';

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof OutlineButton>
>(({ className, disabled, size = 'icon', ...props }, ref) => {
  const { scrollNext, canScrollNext } = useCarousel();

  return (
    <OutlineButton
      ref={ref}
      size={size}
      className={cn(
        'h-8 w-8 rounded-full',

        className,
      )}
      disabled={!canScrollNext || disabled}
      onClick={scrollNext}
      {...props}
    >
      <ChevronRight className='h-4 w-4' />
      <span className='sr-only'>Next slide</span>
    </OutlineButton>
  );
});
CarouselNext.displayName = 'CarouselNext';

const CarouselIndicators = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { api, selectedIndex, opts } = useCarousel();
    const slideCount = api?.slideNodes().length || 0;
    const slidesToScroll = opts?.slidesToScroll || 1;

    // Calculate the number of indicator dots needed
    const indicatorCount = Math.ceil(
      slideCount / (typeof slidesToScroll === 'number' ? slidesToScroll : 1),
    );

    // Calculate which indicator should be active
    const activeIndicator = Math.floor(
      selectedIndex / (typeof slidesToScroll === 'number' ? slidesToScroll : 1),
    );

    return (
      <div ref={ref} className={cn('flex gap-2', className)} {...props}>
        {Array.from({ length: indicatorCount }).map((_, index) => (
          <OutlineButton
            key={index}
            size='icon'
            className={cn(
              'h-2 w-2 rounded-full p-0',
              activeIndicator === index ? 'bg-primary' : 'bg-primary/20',
            )}
            onClick={() =>
              api?.scrollTo(index * (typeof slidesToScroll === 'number' ? slidesToScroll : 1))
            }
          >
            <span className='sr-only'>Go to slide group {index + 1}</span>
          </OutlineButton>
        ))}
      </div>
    );
  },
);
CarouselIndicators.displayName = 'CarouselIndicators';

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselIndicators,
};

export type CarouselApi = NonNullable<ReturnType<typeof useEmblaCarousel>[1]>;

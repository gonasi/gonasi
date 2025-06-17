import type React from 'react';
import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { DOMNode, Element as DomElement, HTMLReactParserOptions } from 'html-react-parser';
import parse, { domToReact } from 'html-react-parser';
import * as LucideIcons from 'lucide-react';

//
// --- Types ---
//

type Variant = 'validation' | 'overview';

interface VariantProps {
  children: React.ReactNode;
  variant: Variant;
}

interface GoParsedContentProps {
  html: string;
  variant?: Variant;
}

//
// --- Animation Configs ---
//

const ANIMATIONS = {
  default: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.35, ease: 'easeOut' },
  },
  smooth: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  icon: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.2, ease: 'easeOut' },
  },
} as const;

//
// --- Style Configs ---
//

const getBaseClasses = (variant: Variant) => (variant === 'validation' ? 'text-xs' : 'text-base');

const COMPONENT_STYLES = {
  error: (variant: Variant) =>
    `text-danger bg-danger/5 inline-block rounded px-1 py-0.5 ${getBaseClasses(variant)}`,
  warning: (variant: Variant) =>
    `bg-warning/5 text-danger inline-block rounded px-1 py-0.5 font-normal italic ${getBaseClasses(variant)}`,
  success: (variant: Variant) =>
    `bg-success/5 text-success inline-block rounded px-1 py-0.5 ${getBaseClasses(variant)}`,
  'go-title': (variant: Variant) =>
    `text-primary font-primary font-semi-bold inline-block ${getBaseClasses(variant)}`,
} as const;

//
// --- Optimized Components ---
//

const createAnimatedComponent = (
  key: keyof typeof COMPONENT_STYLES,
  animation: keyof typeof ANIMATIONS,
) =>
  memo<VariantProps>(({ children, variant }) => (
    <motion.span {...ANIMATIONS[animation]} className={COMPONENT_STYLES[key](variant)}>
      {children}
    </motion.span>
  ));

// Create memoized components
const Error = createAnimatedComponent('error', 'default');
const Warning = createAnimatedComponent('warning', 'smooth');
const Success = createAnimatedComponent('success', 'default');
const GoTitle = createAnimatedComponent('go-title', 'smooth');

//
// --- Component Map ---
//

const COMPONENT_MAP: Record<string, React.FC<VariantProps>> = {
  error: Error,
  warning: Warning,
  'go-title': GoTitle,
  success: Success,
};

//
// --- Optimized Icon Component ---
//

const LucideIcon = memo<{
  iconName: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children: React.ReactNode;
}>(({ iconName, size, strokeWidth, className = '', children }) => {
  const Icon = useMemo(() => (LucideIcons as Record<string, React.FC<any>>)[iconName], [iconName]);

  if (!Icon) return null;

  return (
    <span className='inline'>
      <motion.span {...ANIMATIONS.icon} className='inline-block'>
        <Icon
          size={size}
          strokeWidth={strokeWidth}
          className={`mb-0.5 inline align-middle ${className}`}
        />
      </motion.span>
      {children}
    </span>
  );
});

//
// --- Parser Factory ---
//

const createParserOptions = (variant: Variant): HTMLReactParserOptions => ({
  replace: (domNode: DOMNode) => {
    if (domNode.type !== 'tag') return;

    const el = domNode as DomElement;

    // Handle component spans
    if (el.name === 'span' && el.attribs?.class) {
      const classList = el.attribs.class.split(/\s+/);
      const componentKey = classList.find((cls) => COMPONENT_MAP[cls]);
      const Component = componentKey ? COMPONENT_MAP[componentKey] : null;

      if (Component) {
        return (
          <Component variant={variant}>
            {domToReact(el.children as DOMNode[], createParserOptions(variant))}
          </Component>
        );
      }
    }

    // Handle lucide icons
    if (el.name === 'lucide' && el.attribs?.name) {
      const { name: iconName, size, 'stroke-width': strokeWidth, class: className } = el.attribs;

      return (
        <LucideIcon
          iconName={iconName}
          size={size ? parseInt(size, 10) : undefined}
          strokeWidth={strokeWidth ? parseFloat(strokeWidth) : undefined}
          className={className}
        >
          {domToReact(el.children as DOMNode[], createParserOptions(variant))}
        </LucideIcon>
      );
    }

    return undefined;
  },
});

//
// --- Main Component ---
//

const GoParsedContent: React.FC<GoParsedContentProps> = memo(({ html, variant = 'validation' }) => {
  const parserOptions = useMemo(() => createParserOptions(variant), [variant]);
  const parsed = useMemo(() => parse(html, parserOptions), [html, parserOptions]);

  return <span className='inline'>{parsed}</span>;
});

GoParsedContent.displayName = 'GoParsedContent';

export default GoParsedContent;

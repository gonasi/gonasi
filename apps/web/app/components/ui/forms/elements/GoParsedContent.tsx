import type React from 'react';
import { motion } from 'framer-motion';
import type { DOMNode, Element as DomElement, HTMLReactParserOptions } from 'html-react-parser';
import parse, { domToReact } from 'html-react-parser';

//
// --- Shared Types ---
//

type Variant = 'validation' | 'overview';

interface VariantProps {
  children: React.ReactNode;
  variant: Variant;
}

//
// --- Custom Components ---
//

const Error: React.FC<VariantProps> = ({ children, variant }) => (
  <motion.span
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.35, ease: 'easeOut' }}
    className={`text-danger bg-danger/5 rounded px-1 py-0.5 ${variant === 'validation' ? 'text-xs' : 'text-base'}`}
  >
    {children}
  </motion.span>
);

const Warning: React.FC<VariantProps> = ({ children, variant }) => (
  <motion.span
    initial={{ opacity: 0, y: -6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} // easeOutBack-ish
    className={`bg-warning/5 text-danger rounded px-1 py-0.5 font-normal italic ${variant === 'validation' ? 'text-xs' : 'text-base'}`}
  >
    {children}
  </motion.span>
);

const Success: React.FC<VariantProps> = ({ children, variant }) => (
  <motion.span
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.35, ease: 'easeOut' }}
    className={`bg-success/5 text-success rounded px-1 py-0.5 ${variant === 'validation' ? 'text-xs' : 'text-base'}`}
  >
    {children}
  </motion.span>
);

const GoTitle: React.FC<VariantProps> = ({ children, variant }) => (
  <motion.span
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    className={`text-primary font-primary font-semi-bold ${variant === 'validation' ? 'text-xs' : 'text-base'}`}
  >
    {children}
  </motion.span>
);

//
// --- Component Map ---
//

const componentMap: Record<string, React.FC<VariantProps>> = {
  error: Error,
  warning: Warning,
  'go-title': GoTitle,
  success: Success,
};

//
// --- Parser Options Factory ---
//

const createParserOptions = (variant: Variant): HTMLReactParserOptions => ({
  replace: (domNode: DOMNode) => {
    if (domNode.type === 'tag' && (domNode as DomElement).name === 'span') {
      const el = domNode as DomElement;
      const className = el.attribs?.class;

      if (!className) return;

      const classList = className.split(/\s+/);
      const matchedKey = classList.find((cls) => componentMap[cls]);
      const Component = matchedKey && componentMap[matchedKey];

      if (Component) {
        return (
          <Component variant={variant}>
            {domToReact(el.children as DOMNode[], createParserOptions(variant))}
          </Component>
        );
      }
    }

    return undefined;
  },
});

//
// --- Main Component ---
//

interface GoParsedContentProps {
  html: string;
  variant?: Variant;
}

const GoParsedContent: React.FC<GoParsedContentProps> = ({ html, variant = 'validation' }) => {
  return <>{parse(html, createParserOptions(variant))}</>;
};

export default GoParsedContent;

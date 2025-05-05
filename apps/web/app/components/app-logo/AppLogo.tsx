interface AppLogoProps {
  sizeClass?: string;
}

export function AppLogo({ sizeClass = 'h-8 md:h-10' }: AppLogoProps) {
  return <img src='/assets/images/logo.png' alt='Gonasi Logo' className={sizeClass} />;
}

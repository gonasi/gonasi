import {
  EmailIcon,
  EmailShareButton,
  FacebookIcon,
  FacebookShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  TelegramIcon,
  TelegramShareButton,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
  XIcon,
} from 'react-share';
import { Share2 } from 'lucide-react';

interface CourseShareProps {
  shareUrl: string;
  title: string;
  description: string;
  imageUrl: string;
  hashtag?: string; // e.g. "#gonasi"
}

export function CourseShare({
  shareUrl,
  title,
  description = 'Check out this course on Gonasi!',
  imageUrl,
  hashtag = '#Gonasi',
}: CourseShareProps) {
  return (
    <div className='flex flex-col gap-2 px-4 md:px-0'>
      <div className='flex flex-col gap-0.5'>
        <div className='flex items-center gap-2'>
          <Share2 className='h-4 w-4' />
          <h4 className='mt-1 text-sm font-semibold'>Share this course</h4>
        </div>
        <p className='text-muted-foreground font-secondary text-xs'>
          Help others discover this amazing learning opportunity
        </p>
      </div>

      <div className='flex flex-wrap gap-2 py-2'>
        {/* Facebook */}

        <FacebookShareButton
          url={shareUrl}
          hashtag={hashtag}
          resetButtonStyle
          className='rounded-full transition-all duration-200 hover:scale-110 hover:opacity-80 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
        >
          <FacebookIcon size={32} round />
        </FacebookShareButton>

        {/* Twitter (X) */}
        <TwitterShareButton
          url={shareUrl}
          title={title}
          hashtags={[hashtag.replace('#', '')]}
          resetButtonStyle
          className='rounded-full transition-all duration-200 hover:scale-110 hover:opacity-80 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
        >
          <XIcon size={32} round />
        </TwitterShareButton>

        {/* LinkedIn */}
        <LinkedinShareButton
          url={shareUrl}
          title={title}
          summary={description}
          source='Gonasi'
          resetButtonStyle
          className='rounded-full transition-all duration-200 hover:scale-110 hover:opacity-80 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
        >
          <LinkedinIcon size={32} round />
        </LinkedinShareButton>

        {/* WhatsApp */}
        <WhatsappShareButton
          url={shareUrl}
          title={title}
          separator=' - '
          resetButtonStyle
          className='rounded-full transition-all duration-200 hover:scale-110 hover:opacity-80 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
        >
          <WhatsappIcon size={32} round />
        </WhatsappShareButton>

        {/* Telegram */}
        <TelegramShareButton
          url={shareUrl}
          title={title}
          resetButtonStyle
          className='rounded-full transition-all duration-200 hover:scale-110 hover:opacity-80 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
        >
          <TelegramIcon size={32} round />
        </TelegramShareButton>

        {/* Email */}
        <EmailShareButton
          url={shareUrl}
          subject={title}
          body={`${description}\n\n${shareUrl}`}
          resetButtonStyle
          className='rounded-full transition-all duration-200 hover:scale-110 hover:opacity-80 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
        >
          <EmailIcon size={32} round />
        </EmailShareButton>
      </div>
    </div>
  );
}

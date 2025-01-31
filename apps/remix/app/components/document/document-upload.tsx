import { useMemo, useState } from 'react';

import { Trans, msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { Loader } from 'lucide-react';
import { useNavigate } from 'react-router';
import { match } from 'ts-pattern';

import { useLimits } from '@documenso/ee/server-only/limits/provider/client';
import { useSession } from '@documenso/lib/client-only/providers/session';
import { APP_DOCUMENT_UPLOAD_SIZE_LIMIT } from '@documenso/lib/constants/app';
import { DEFAULT_DOCUMENT_TIME_ZONE, TIME_ZONES } from '@documenso/lib/constants/time-zones';
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { formatDocumentsPath } from '@documenso/lib/utils/teams';
import { trpc } from '@documenso/trpc/react';
import { cn } from '@documenso/ui/lib/utils';
import { DocumentDropzone } from '@documenso/ui/primitives/document-dropzone';
import { useToast } from '@documenso/ui/primitives/use-toast';

export type DocumentUploadDropzoneProps = {
  className?: string;
  team?: {
    id: number;
    url: string;
  };
};

export const DocumentUploadDropzone = ({ className, team }: DocumentUploadDropzoneProps) => {
  const navigate = useNavigate();

  const userTimezone =
    TIME_ZONES.find((timezone) => timezone === Intl.DateTimeFormat().resolvedOptions().timeZone) ??
    DEFAULT_DOCUMENT_TIME_ZONE;

  const { user } = useSession();

  const { _ } = useLingui();
  const { toast } = useToast();

  const { quota, remaining, refreshLimits } = useLimits();

  const [isLoading, setIsLoading] = useState(false);

  const { mutateAsync: createDocument } = trpc.document.createDocument.useMutation();

  const disabledMessage = useMemo(() => {
    if (remaining.documents === 0) {
      return team
        ? msg`Document upload disabled due to unpaid invoices`
        : msg`You have reached your document limit.`;
    }

    if (!user.emailVerified) {
      return msg`Verify your email to upload documents.`;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining.documents, user.emailVerified, team]);

  const onFileDrop = async (file: File) => {
    try {
      setIsLoading(true);

      // Todo
      // const { type, data } = await putPdfFile(file);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/file', {
        method: 'POST',
        body: formData,
      })
        .then((res) => res.json())
        .catch((e) => {
          console.error('Upload failed:', e);
          throw new AppError('UPLOAD_FAILED');
        });

      // const { id: documentDataId } = await createDocumentData({
      //   type,
      //   data,
      // });

      const { id } = await createDocument({
        title: file.name,
        documentDataId: response.id, // todo
        timezone: userTimezone,
      });

      void refreshLimits();

      toast({
        title: _(msg`Document uploaded`),
        description: _(msg`Your document has been uploaded successfully.`),
        duration: 5000,
      });

      // Todo
      // analytics.capture('App: Document Uploaded', {
      //   userId: session?.user.id,
      //   documentId: id,
      //   timestamp: new Date().toISOString(),
      // });

      void navigate(`${formatDocumentsPath(team?.url)}/${id}/edit`);
    } catch (err) {
      const error = AppError.parseError(err);

      console.error(err);

      const errorMessage = match(error.code)
        .with('INVALID_DOCUMENT_FILE', () => msg`You cannot upload encrypted PDFs`)
        .with(
          AppErrorCode.LIMIT_EXCEEDED,
          () => msg`You have reached your document limit for this month. Please upgrade your plan.`,
        )
        .otherwise(() => msg`An error occurred while uploading your document.`);

      toast({
        title: _(msg`Error`),
        description: _(errorMessage),
        variant: 'destructive',
        duration: 7500,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onFileDropRejected = () => {
    toast({
      title: _(msg`Your document failed to upload.`),
      description: _(msg`File cannot be larger than ${APP_DOCUMENT_UPLOAD_SIZE_LIMIT}MB`),
      duration: 5000,
      variant: 'destructive',
    });
  };

  return (
    <div className={cn('relative', className)}>
      <DocumentDropzone
        className="h-[min(400px,50vh)]"
        disabled={remaining.documents === 0 || !user.emailVerified}
        disabledMessage={disabledMessage}
        onDrop={onFileDrop}
        onDropRejected={onFileDropRejected}
      />

      <div className="absolute -bottom-6 right-0">
        {team?.id === undefined &&
          remaining.documents > 0 &&
          Number.isFinite(remaining.documents) && (
            <p className="text-muted-foreground/60 text-xs">
              <Trans>
                {remaining.documents} of {quota.documents} documents remaining this month.
              </Trans>
            </p>
          )}
      </div>

      {isLoading && (
        <div className="bg-background/50 absolute inset-0 flex items-center justify-center rounded-lg">
          <Loader className="text-muted-foreground h-12 w-12 animate-spin" />
        </div>
      )}
    </div>
  );
};

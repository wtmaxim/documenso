import { Trans } from '@lingui/macro';
import { ChevronLeft } from 'lucide-react';
import { Link, Outlet } from 'react-router';

import { Button } from '@documenso/ui/primitives/button';

import { Header as AuthenticatedHeader } from '~/components/general/app-header';

import type { Route } from './+types/_layout';

export function loader({ context }: Route.LoaderArgs) {
  return {
    user: context.session?.user,
    teams: context.session?.teams || [],
  };
}

/**
 * A layout to handle scenarios where the user is a recipient of a given resource
 * where we do not care whether they are authenticated or not.
 *
 * Such as direct template access, or signing.
 */
export default function RecipientLayout({ loaderData }: Route.ComponentProps) {
  const { user, teams } = loaderData;

  return (
    <div className="min-h-screen">
      {user && <AuthenticatedHeader user={user} teams={teams} />}

      <main className="mb-8 mt-8 px-4 md:mb-12 md:mt-12 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="mx-auto flex min-h-[80vh] w-full items-center justify-center py-32">
      <div>
        <p className="text-muted-foreground font-semibold">
          <Trans>404 Not found</Trans>
        </p>

        <h1 className="mt-3 text-2xl font-bold md:text-3xl">
          <Trans>Oops! Something went wrong.</Trans>
        </h1>

        <p className="text-muted-foreground mt-4 text-sm">
          <Trans>
            The resource you are looking for may have been disabled, deleted or may have never
            existed.
          </Trans>
        </p>

        <div className="mt-6 flex gap-x-2.5 gap-y-4 md:items-center">
          <Button asChild className="w-32">
            <Link to="/">
              <ChevronLeft className="mr-2 h-4 w-4" />
              <Trans>Go Back</Trans>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

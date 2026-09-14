import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, SignIn, SignUp } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { ArrowLeft } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { DashboardPage, HomePage, OperatorPage, OperatorsPage, TripPage } from '@/pages/tripquote-pages';
import {
  Redirect,
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#E65D3E',
    colorForeground: '#1E2B3A',
    colorMutedForeground: '#68727B',
    colorDanger: '#B13B31',
    colorBackground: '#FFFDF8',
    colorInput: '#F5F1E9',
    colorInputForeground: '#1E2B3A',
    colorNeutral: '#D9D0C3',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    borderRadius: '0.8rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fffdf8] rounded-2xl w-[440px] max-w-full overflow-hidden',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#1e2b3a] font-semibold',
    headerSubtitle: 'text-[#68727b]',
    socialButtonsBlockButtonText: 'text-[#1e2b3a]',
    formFieldLabel: 'text-[#1e2b3a]',
    footerActionLink: 'text-[#e65d3e]',
    footerActionText: 'text-[#68727b]',
    dividerText: 'text-[#68727b]',
    identityPreviewEditButton: 'text-[#e65d3e]',
    formFieldSuccessText: 'text-[#2d8b7c]',
    alertText: 'text-[#b13b31]',
    logoBox: 'max-h-12',
    logoImage: 'max-h-12',
    socialButtonsBlockButton: 'border-[#d9d0c3] bg-[#f5f1e9]',
    formButtonPrimary: 'bg-[#e65d3e] text-white hover:bg-[#cf4e32]',
    formFieldInput: 'border-[#d9d0c3] bg-[#f5f1e9] text-[#1e2b3a]',
    footerAction: 'bg-transparent',
    dividerLine: 'bg-[#d9d0c3]',
    alert: 'border-[#b13b31]/20 bg-[#b13b31]/10',
    otpCodeFieldInput: 'border-[#d9d0c3] bg-[#f5f1e9]',
    formFieldRow: 'text-[#1e2b3a]',
    main: 'bg-transparent',
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="relative w-full max-w-[440px]">
        <a href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft size={15} /> Back to planner
        </a>
        <SignIn
          routing="path"
          path={`${basePath}/sign-in`}
          signUpUrl={`${basePath}/sign-up`}
        />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="relative w-full max-w-[440px]">
        <a href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft size={15} /> Back to planner
        </a>
        <SignUp
          routing="path"
          path={`${basePath}/sign-up`}
          signInUrl={`${basePath}/sign-in`}
        />
      </div>
    </div>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/trip/:tripId" component={TripPage} />
        <Route path="/operators" component={OperatorsPage} />
        <Route path="/operators/:operatorId" component={OperatorPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route path="/login"><Redirect to="/sign-in" /></Route>
        <Route path="/register"><Redirect to="/sign-up" /></Route>
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: 'Welcome back',
            subtitle: 'Sign in to access your routes',
          },
        },
        signUp: {
          start: {
            title: 'Create your account',
            subtitle: 'Keep your next road trip close',
          },
        },
      }}
      routerPush={(to) => window.history.pushState({}, '', stripBase(to))}
      routerReplace={(to) => window.history.replaceState({}, '', stripBase(to))}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={basePath}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;

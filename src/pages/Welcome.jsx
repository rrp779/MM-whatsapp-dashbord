import { useCallback, useState } from 'react';
import branding from '../../branding';
import content from '../constants/pages.json';
import { Check, Circle, Copy, User, Bot, ChevronDown } from 'lucide-react';
import { useSetupStatus } from '../hooks/useSetupStatus';

/**
 * Welcome (Dashboard) page. Setup checklist on the left and optional bot
 * profile card on the right. Styling: refined hierarchy, soft depth, and
 * clear micro-interactions.
 */
function Welcome() {
  const { welcome } = content;
  const pageTitle = welcome.pageTitle.replace('{{brandName}}', branding.brandName);
  const setup = welcome.setupChecklist ?? { title: 'Get started', steps: [], viewProfile: 'View Profile' };

  const { steps, bot, loading, loadingBot } = useSetupStatus();
  const [copied, setCopied] = useState(false);

  const waMeUrl = bot ? `https://wa.me/${bot.phone_number.replace(/\D/g, '')}` : '';

  const handleCopyUrl = useCallback(() => {
    if (!bot || !waMeUrl) return;
    navigator.clipboard?.writeText(waMeUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [bot, waMeUrl]);

  const stepConfigById = (setup.steps || []).reduce((acc, s) => {
    acc[s.id] = s;
    return acc;
  }, {});

  const completedCount = steps.filter((s) => s.done).length;
  const whereLabel = setup.whereLabel ?? 'Where to configure';
  const variablesLabel = setup.variablesLabel ?? 'What to set';
  const filePathLabel = setup.filePathLabel ?? 'File path';
  const errorCausesLabel = setup.errorCausesLabel ?? 'Possible causes';

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10">
      {/* Header: stronger hierarchy */}
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-text">
          {pageTitle}
        </h1>
        <p className="max-w-xl text-base text-text-muted">
          {welcome.description}
        </p>
      </header>

      <section className="grid gap-8 lg:grid-cols-[1fr_minmax(340px,420px)] lg:items-start">
        {/* Left: Setup checklist — accent stripe, progress, staggered steps */}
        <div
          className="relative overflow-hidden rounded-xl border border-border bg-surface shadow-md"
          style={{
            boxShadow: '0 1px 3px rgb(0 0 0 / 0.06), 0 4px 12px rgb(0 0 0 / 0.04)',
          }}
        >
          {/* Left accent */}
          <div
            className="absolute left-0 top-0 h-full w-1 bg-primary"
            aria-hidden
          />
          <div className="pl-6 pr-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-lg font-semibold text-text">
                  {setup.title}
                </h2>
                {setup.subtitle && (
                  <p className="mt-0.5 text-sm text-text-muted">
                    {setup.subtitle}
                  </p>
                )}
              </div>
              <span className="shrink-0 rounded-full bg-primary-muted px-2.5 py-0.5 text-xs font-medium text-primary">
                {completedCount} of {steps.length}
              </span>
            </div>
            <ul className="mt-4 space-y-3" aria-label="Setup steps">
              {steps.map((step, index) => {
                const config = stepConfigById[step.id] ?? {};
                const title = config.title ?? step.label;
                const description = config.description ?? '';
                const where = config.where ?? '';
                const variables = config.variables ?? '';
                const filePaths = config.filePaths ?? [];
                const errorSubSteps = config.errorSubSteps ?? [];
                const isPending = !step.done;
                const showErrorSubSteps = isPending && errorSubSteps.length > 0;
                return (
                  <li
                    key={step.id}
                    className={`animate-fade-in-up rounded-lg transition-colors duration-200 ${
                      isPending ? 'hover:bg-error/5' : 'hover:bg-primary-muted/20'
                    }`}
                    style={{ animationDelay: `${index * 45}ms`, opacity: 0 }}
                  >
                    <details className="group" aria-label={`${title} step`}>
                      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg px-3 py-3 focus:outline-none [&::-webkit-details-marker]:hidden">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
                            step.done
                              ? 'bg-primary text-white shadow-sm'
                              : 'border-2 border-error bg-error/10 text-error'
                          }`}
                          aria-hidden
                        >
                          {step.done ? (
                            <Check className="h-5 w-5" strokeWidth={2.5} />
                          ) : (
                            <Circle className="h-4 w-4" strokeWidth={2} />
                          )}
                        </span>
                        <span
                          className={`min-w-0 flex-1 text-left text-sm font-semibold transition-colors ${
                            step.done ? 'text-text' : 'text-error'
                          }`}
                        >
                          {title}
                        </span>
                        {loading && index === 0 && (
                          <span className="text-xs text-primary">Checking…</span>
                        )}
                        {loadingBot && index === 1 && (
                          <span className="text-xs text-primary">Checking…</span>
                        )}
                        <ChevronDown
                          className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 text-text-muted"
                          aria-hidden
                        />
                      </summary>
                      <div className="border-t border-border/60 pt-3 pb-2 pl-12 pr-1">
                        {description && (
                          <p
                            className={`text-sm leading-snug ${
                              step.done ? 'text-text-muted' : 'text-error/80'
                            }`}
                          >
                            {description}
                          </p>
                        )}
                        {(where || variables || filePaths.length > 0) && (
                          <dl
                            className={`mt-2 space-y-1.5 text-xs ${
                              step.done ? 'text-text-muted' : 'text-error/70'
                            }`}
                          >
                            {where && (
                              <div className="flex gap-1.5">
                                <dt className="shrink-0 font-medium">{whereLabel}:</dt>
                                <dd className="min-w-0 break-words">{where}</dd>
                              </div>
                            )}
                            {filePaths.length > 0 && (
                              <div className="flex flex-col gap-1">
                                <dt className="shrink-0 font-medium">{filePathLabel}:</dt>
                                <dd className="min-w-0 space-y-1">
                                  {filePaths.map((path, i) => (
                                    <code
                                      key={i}
                                      className="block w-fit select-all rounded border border-primary/30 bg-primary-muted/30 px-2 py-1 font-mono text-[11px] text-text"
                                      title="Select to copy"
                                    >
                                      {path}
                                    </code>
                                  ))}
                                </dd>
                              </div>
                            )}
                            {variables && variables !== '—' && (
                              <div className="flex gap-1.5">
                                <dt className="shrink-0 font-medium">{variablesLabel}:</dt>
                                <dd className="min-w-0 break-words font-mono text-[11px]">
                                  {variables}
                                </dd>
                              </div>
                            )}
                          </dl>
                        )}
                        {showErrorSubSteps && (
                          <details
                            className="group/err mt-2 rounded-md border border-error/30 bg-error/5"
                            aria-label={`${errorCausesLabel} for ${title}`}
                          >
                            <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-error focus:outline-none [&::-webkit-details-marker]:hidden">
                              <ChevronDown
                                className="h-3.5 w-3.5 shrink-0 -rotate-90 transition-transform group-open/err:rotate-0"
                                aria-hidden
                              />
                              {errorCausesLabel}
                            </summary>
                            <ul className="list-disc list-inside space-y-1 px-2.5 pb-2.5 pt-0 text-xs text-error/90">
                              {errorSubSteps.map((bullet, i) => (
                                <li key={i}>{bullet}</li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Right: Bot profile card or empty state */}
        <div className="lg:sticky lg:top-6">
          {bot ? (
            <div
              className="overflow-hidden rounded-xl border border-border bg-surface shadow-lg transition-shadow hover:shadow-xl"
              style={{
                boxShadow: '0 4px 6px rgb(0 0 0 / 0.05), 0 10px 24px rgb(0 0 0 / 0.06)',
              }}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading text-xl font-bold tracking-tight text-text truncate">
                      {bot.name}
                    </h3>
                    <p className="mt-1 text-xs font-medium uppercase tracking-widest text-text-muted">
                      WhatsApp
                    </p>
                    <p className="mt-2 text-lg font-semibold text-primary">
                      +{bot.phone_number.replace(/^\+/, '')}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <a
                        href={waMeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-0 flex-1 truncate text-sm text-text underline underline-offset-2 hover:text-text focus:outline-none rounded"
                      >
                        {waMeUrl}
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyUrl}
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-md p-1.5 text-text-muted transition-colors hover:bg-primary-muted/50 hover:text-primary focus:outline-none"
                        aria-label={copied ? 'Copied' : 'Copy URL'}
                        title={copied ? 'Copied' : 'Copy URL'}
                      >
                        <Copy className="h-4 w-4" strokeWidth={2} />
                        {copied ? (
                          <span className="text-xs font-medium text-primary">Copied</span>
                        ) : null}
                      </button>
                    </div>
                  </div>
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-muted/70 text-primary"
                    aria-hidden
                  >
                    <User className="h-7 w-7" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/60 py-12 px-6 text-center"
              style={{
                boxShadow: '0 1px 2px rgb(0 0 0 / 0.04)',
              }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-muted/60 text-primary">
                <Bot className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <p className="mt-4 text-sm font-medium text-text-muted">
                Complete “Connect your WhatsApp bot” to see your bot profile here.
              </p>
              <p className="mt-1 text-xs text-text-muted/80">
                Your name and number will appear in this card.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Welcome;

"use client";

import { useActionState, useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getContactToken, submitContact } from "@/lib/contact/actions";
import {
  CONTACT_FIELDS,
  CONTACT_FORM_ID,
  CONTACT_LIMITS,
  HONEYPOT_FIELD,
  INQUIRY_TYPES,
  PAGE_FIELD,
  PRIVACY_NOTE,
  TOKEN_FIELD,
  initialContactState,
  pageFromLocation,
  type ContactField,
} from "@/lib/contact/fields";

/*
 * The hire-me form. Progressive enhancement: without JavaScript it is a plain POST to the server action and the
 * page comes back with the same state (errors, values, messages); with JavaScript, useActionState updates it in place.
 */

const id = (field: string) => `cf-${field}`;
const errorId = (field: string) => `cf-${field}-error`;

const noSubscribe = () => () => {};

const control =
  "block w-full min-h-11 rounded-none border border-text-3 bg-surface px-3.5 py-2.5 text-base text-text " +
  "transition-colors duration-[var(--dur-1)] hover:border-text-2 focus-visible:border-text aria-invalid:border-text";

export function ContactFormClient({ email }: { email: string }) {
  const pathname = usePathname();
  // The permalink is where the browser posts without JavaScript; the fragment brings the visitor back to the form.
  const [state, formAction, pending] = useActionState(submitContact, initialContactState, `${pathname}#${CONTACT_FORM_ID}`);
  const formRef = useRef<HTMLFormElement>(null);
  const tokenRequested = useRef(false);
  const [token, setToken] = useState("");
  // Where the visitor came from: "" on the server (no-JS falls back to the Referer), the real path in the browser.
  const clientPage = useSyncExternalStore(noSubscribe, pageFromLocation, () => "");

  const errors = state.errors ?? {};
  const values = state.values ?? {};
  const firstError = CONTACT_FIELDS.find((f) => errors[f]);

  // After a submit with errors, move focus to the first invalid field (without JS, autoFocus does it on load).
  useEffect(() => {
    if (state.status !== "invalid") return;
    const invalid = formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']");
    const target = invalid instanceof HTMLFieldSetElement ? invalid.querySelector<HTMLElement>("input") : invalid;
    target?.focus();
  }, [state]);

  /** Starts the minimum-fill-time clock: the server signs the moment the visitor first focuses the form. */
  function startClock() {
    if (tokenRequested.current) return;
    tokenRequested.current = true;
    getContactToken()
      .then((t) => {
        if (t) setToken(t);
        else tokenRequested.current = false;
      })
      .catch(() => {
        tokenRequested.current = false; // try again on the next focus
      });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (pending) event.preventDefault(); // one submission at a time
  }

  const describedBy = (field: ContactField, hint?: string) =>
    [hint, errors[field] ? errorId(field) : undefined].filter(Boolean).join(" ") || undefined;

  return (
    <form
      id={CONTACT_FORM_ID}
      ref={formRef}
      action={formAction}
      onSubmit={onSubmit}
      onFocus={startClock}
      noValidate
      aria-describedby="cf-required-note"
      className="@container space-y-7"
    >
      <p id="cf-required-note" className="text-sm text-text-2">
        Fields marked <span aria-hidden="true">*</span>
        <span className="sr-only">with an asterisk</span> are required.
      </p>

      <div className="grid gap-7 @xl:grid-cols-2 @xl:gap-x-6">
        <Field label="Name" field="name" required error={errors.name}>
          <input
            id={id("name")}
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={CONTACT_LIMITS.name}
            defaultValue={values.name ?? ""}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("name")}
            autoFocus={firstError === "name"}
            className={control}
          />
        </Field>

        <Field label="Email" field="email" required error={errors.email}>
          <input
            id={id("email")}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            maxLength={CONTACT_LIMITS.email}
            defaultValue={values.email ?? ""}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy("email")}
            autoFocus={firstError === "email"}
            className={control}
          />
        </Field>
      </div>

      <Field label="Company" field="company" optional error={errors.company}>
        <input
          id={id("company")}
          name="company"
          type="text"
          autoComplete="organization"
          maxLength={CONTACT_LIMITS.company}
          defaultValue={values.company ?? ""}
          aria-invalid={errors.company ? true : undefined}
          aria-describedby={describedBy("company")}
          autoFocus={firstError === "company"}
          className={control}
        />
      </Field>

      <fieldset
        role="radiogroup"
        aria-labelledby="cf-inquiryType-legend"
        aria-required="true"
        aria-invalid={errors.inquiryType ? true : undefined}
        aria-describedby={describedBy("inquiryType")}
        className="min-w-0"
      >
        <legend id="cf-inquiryType-legend" className="label-mono mb-3 text-text-2">
          What&apos;s this about? <Required />
        </legend>
        <div className="grid gap-3 @md:flex @md:flex-wrap">
          {INQUIRY_TYPES.map((option, i) => (
            <label
              key={option.value}
              className="flex min-h-11 cursor-pointer items-center gap-3 border border-text-3 px-4 py-2 text-text transition-colors duration-[var(--dur-1)] hover:border-text-2 has-checked:border-text has-checked:bg-surface-2 [[aria-invalid=true]_&]:border-text-2"
            >
              <input
                type="radio"
                name="inquiryType"
                value={option.value}
                required
                defaultChecked={values.inquiryType === option.value}
                autoFocus={firstError === "inquiryType" && i === 0}
                className="size-4 shrink-0 cursor-pointer appearance-none rounded-full border border-text-2 bg-bg checked:border-text checked:bg-text checked:shadow-[inset_0_0_0_3px_var(--color-bg)]"
              />
              {option.label}
            </label>
          ))}
        </div>
        <FieldError field="inquiryType" error={errors.inquiryType} />
      </fieldset>

      <Field label="Message" field="message" required error={errors.message} hint={`At least ${CONTACT_LIMITS.messageMin} characters.`}>
        <textarea
          id={id("message")}
          name="message"
          required
          rows={6}
          maxLength={CONTACT_LIMITS.messageMax}
          defaultValue={values.message ?? ""}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={describedBy("message", "cf-message-hint")}
          autoFocus={firstError === "message"}
          className={`${control} min-h-40 resize-y leading-relaxed`}
        />
      </Field>

      {/* Spam trap: invisible and unreachable for people; bots that fill every field get rejected. */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor={id(HONEYPOT_FIELD)}>Leave this field empty</label>
        <input id={id(HONEYPOT_FIELD)} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <input type="hidden" name={TOKEN_FIELD} value={state.token || token} />
      <input type="hidden" name={PAGE_FIELD} value={clientPage || state.page || ""} />

      <div className="flex flex-col gap-5 @lg:flex-row @lg:items-center @lg:gap-8">
        <button
          type="submit"
          aria-disabled={pending || undefined}
          className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-3 bg-accent px-7 font-mono text-sm tracking-[0.08em] text-accent-ink uppercase aria-disabled:cursor-progress"
        >
          {pending ? "Sending…" : "Send message"}
          <span
            aria-hidden="true"
            className="transition-transform duration-[var(--dur-1)] ease-out group-hover:translate-x-1 group-aria-disabled:translate-x-0"
          >
            →
          </span>
        </button>
        <p className="text-sm text-text-2">{PRIVACY_NOTE}</p>
      </div>

      {/* Always in the DOM (never display:none) so screen readers announce what appears in it. */}
      <div role="status" aria-live="polite" aria-atomic="true">
        {state.message ? (
          <StatusMessage tone={state.status === "success" ? "success" : "problem"}>
            {state.message}
            {state.offerEmail ? (
              <>
                {" "}
                <a href={`mailto:${email}`} className="text-text underline decoration-text-2 [overflow-wrap:anywhere] hover:decoration-text">
                  {email}
                </a>
              </>
            ) : null}
          </StatusMessage>
        ) : null}
      </div>
    </form>
  );
}

function Required() {
  return (
    <span aria-hidden="true" className="text-text">
      *
    </span>
  );
}

function Field({
  label,
  field,
  required,
  optional,
  hint,
  error,
  children,
}: {
  label: string;
  field: ContactField;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id(field)} className="label-mono mb-3 block text-text-2">
        {label} {required ? <Required /> : null}
        {optional ? <span className="normal-case tracking-normal">(optional)</span> : null}
      </label>
      {hint ? (
        <p id={`cf-${field}-hint`} className="-mt-1.5 mb-3 text-sm text-text-2">
          {hint}
        </p>
      ) : null}
      {children}
      <FieldError field={field} error={error} />
    </div>
  );
}

function FieldError({ field, error }: { field: ContactField; error?: string }) {
  if (!error) return null;
  return (
    <p id={errorId(field)} className="mt-2.5 flex items-start gap-2 text-sm text-text">
      <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-[0.2em] size-[1em] shrink-0" fill="none">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4.25v4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11.25" r="0.9" fill="currentColor" />
      </svg>
      <span>
        <span className="sr-only">Error: </span>
        {error}
      </span>
    </p>
  );
}

function StatusMessage({ tone, children }: { tone: "success" | "problem"; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-l-2 border-text py-1 pl-4 @md:flex-row @md:gap-4">
      <span className="label-mono shrink-0 pt-[0.2em] text-text-2">{tone === "success" ? "Sent" : "Not sent"}</span>
      <p className="text-text">{children}</p>
    </div>
  );
}

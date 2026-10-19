import type { ComponentProps } from 'react';

/** The warm-grey rounded card used across the wireframes. */
export function Card({ className = '', ...rest }: ComponentProps<'section'>) {
  return <section className={`rounded-[20px] bg-card ${className}`} {...rest} />;
}

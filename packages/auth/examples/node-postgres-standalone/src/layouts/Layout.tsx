import {
  Layout as SaplingLayout,
  type LayoutProps,
} from "@sapling/sapling";
import { html } from "hono/html";
import { BaseHead } from "../components/BaseHead.js";
import { UserProfile } from "../components/UserProfile.js";
import type { User } from "../db/schema.js";

export type BaseLayoutProps = LayoutProps & {
  title?: string;
  description?: string;
  additionalHead?: string;
  user?: User;
};

export default async function Layout(props: BaseLayoutProps) {
  const defaultHeadContent = BaseHead({
    title: props.title,
    description: props.description,
  });

  const combinedHead = html`
    ${defaultHeadContent}
    ${props.additionalHead || ''}
  `;

  return (
    <SaplingLayout
      enableIslands
      head={combinedHead}
      bodyClass={props.bodyClass || `font-sans @dark:bg-black @dark:text-white`}
    >
      <>
        {/* User profile - positioned fixed in top right */}
        {props.user && (
          <div class="fixed top-4 right-4 z-50">
            <UserProfile user={props.user} />
          </div>
        )}
        {props.children}
      </>
    </SaplingLayout>
  );
}

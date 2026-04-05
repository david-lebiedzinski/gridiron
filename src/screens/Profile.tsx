import Page from "../components/Page";
import ProfileSettings from "./profile/ProfileSettings";
import { PROFILE } from "../strings";

export default function ProfilePage() {
  return (
    <Page>
      <Page.Header
        eyebrow={PROFILE.eyebrow}
        title={PROFILE.title}
        subtitle={PROFILE.subtitle}
      />
      <ProfileSettings />
    </Page>
  );
}

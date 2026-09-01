import { DataSource } from 'typeorm';
import type { Seeder } from 'typeorm-extension';
import { SiteProfileEntity } from '../../app/site-profile/site-profile.entity.js';

/**
 * Single-row config (see SiteProfileService.getOrCreate) - ported from the
 * pre-CMS static site's hardcoded Masthead/About copy
 * (`components/Masthead.vue`, `pages/index.vue`, `config/*.json` on the
 * `develop` branch). `avatarUrl` and `socialLinks` are left empty on
 * purpose: the old site only had a placeholder avatar and dead `href="#!"`
 * social icons, no real values to carry over - fill those in via the CMS.
 *
 * Skip-not-overwrite, like ExperiencesSeed - but "already seeded" here means
 * the row has real content, not just that a row exists: SiteProfileService
 * .getOrCreate() auto-creates an empty row on the very first GET
 * `/api/site-profile` (i.e. the first time anyone loads the homepage), so
 * in practice a row exists before this seeder ever gets a chance to run.
 * Treating mere row-existence as "already seeded" would make this a no-op
 * forever. Instead, only skip once `heroTitle`/`bio` are actually filled
 * in (by this seeder or by hand via the CMS) - fill an empty row in place
 * rather than inserting a second one.
 */
export default class SiteProfileSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(SiteProfileEntity);
    const [existing] = await repository.find({ take: 1 });

    if (existing && (existing.heroTitle || existing.bio)) {
      console.log('Site profile fixture already has content, skipped');
      return;
    }

    const content = {
      heroTitle: 'Nurfirliana Muzanella',
      heroSubtitle: 'Frontend Engineer',
      bio: "Hello, my name is Nurfirliana Muzanella. I'm Frontend Engineer. Combine the art of design with the art of programming. Have good experience on layouting html and play with css and javascript for more attractive layouting. Make the layout fit with all screen device. So if you interesting with me, you can send me a message or call me. Let's talk :)",
    };

    if (existing) {
      await repository.save({ ...existing, ...content });
      console.log('Site profile fixture filled in (row already existed empty)');
      return;
    }

    await repository.save(
      repository.create({ ...content, avatarUrl: '', socialLinks: [] }),
    );
    console.log('Site profile fixture created');
  }
}

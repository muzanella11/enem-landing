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
 * Skip-not-overwrite, like ExperiencesSeed: only creates the row when none
 * exists yet, so a later re-run never clobbers edits made via the CMS.
 */
export default class SiteProfileSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(SiteProfileEntity);
    const existing = await repository.find({ take: 1 });

    if (existing.length > 0) {
      console.log('Site profile fixture already exists, skipped');
      return;
    }

    await repository.save(
      repository.create({
        heroTitle: 'Nurfirliana Muzanella',
        heroSubtitle: 'Frontend Engineer',
        bio: "Hello, my name is Nurfirliana Muzanella. I'm Frontend Engineer. Combine the art of design with the art of programming. Have good experience on layouting html and play with css and javascript for more attractive layouting. Make the layout fit with all screen device. So if you interesting with me, you can send me a message or call me. Let's talk :)",
        avatarUrl: '',
        socialLinks: [],
      }),
    );
    console.log('Site profile fixture created');
  }
}

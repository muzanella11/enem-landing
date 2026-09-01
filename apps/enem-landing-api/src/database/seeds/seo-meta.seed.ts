import { DataSource } from 'typeorm';
import type { Seeder } from 'typeorm-extension';
import { SeoMetaEntity } from '../../app/seo-meta/seo-meta.entity.js';

/**
 * Seeds a keyword-targeted title/description for the "home" page - the
 * live site had none (confirmed: GET /seo-meta/home 404'd on prod before
 * this ran), so index.vue was falling back to its generic hardcoded
 * DEFAULT_SEO copy. Targets "frontend"/"frontend engineer"/"senior
 * frontend engineer" honestly (10+ years since 2014, Lead Frontend
 * Engineer at PT. Travlr Guides Indonesia - see ExperiencesSeed) rather
 * than claiming an exact past job title that wasn't held.
 *
 * Skip-not-overwrite, like the other seeders here: only fills in a page
 * key that has no row yet, never touches one that's already been set
 * (seeded by this, or edited by hand via the CMS).
 */
export default class SeoMetaSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(SeoMetaEntity);
    const existing = await repository.findOne({ where: { pageKey: 'home' } });

    if (existing) {
      console.log('SEO meta fixture for "home" already exists, skipped');
      return;
    }

    await repository.save(
      repository.create({
        pageKey: 'home',
        title: 'Nurfirliana Muzanella — Senior Frontend Engineer',
        description:
          'Nurfirliana Muzanella is a senior frontend engineer with 10+ years building web applications using Vue.js, React, Node.js, and TypeScript, including as Lead Frontend Engineer at PT. Travlr Guides Indonesia. View portfolio, work experience, and contact.',
        ogImageUrl: '',
      }),
    );
    console.log('SEO meta fixture for "home" created');
  }
}

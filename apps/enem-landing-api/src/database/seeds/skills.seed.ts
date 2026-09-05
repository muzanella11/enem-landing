import { DataSource } from 'typeorm';
import type { Seeder } from 'typeorm-extension';
import { SkillEntity } from '../../app/skills/skill.entity.js';

const SKILLS_FIXTURE = [
  'CSS',
  'Docker',
  'HTML',
  'Javascript',
  'Node JS',
  'PHP',
  'Python',
  'React Js',
  'Vue JS',
];

/**
 * The hero section's skill chips (Masthead.vue) - a short, curated list,
 * not the full tech stack from every experience/project (see
 * ExperiencesSeed's fixture for that). `category` is always "General" since
 * this list isn't grouped on the homepage; `level`/`icon` are left null,
 * matching what's live today.
 *
 * Skip-not-overwrite by `name`, like ExperiencesSeed: only creates a skill
 * that doesn't already exist, never touches one edited by hand via the CMS.
 */
export default class SkillsSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(SkillEntity);

    for (const name of SKILLS_FIXTURE) {
      const existing = await repository.findOne({ where: { name } });

      if (existing) {
        console.log(`Skill fixture "${name}" already exists, skipped`);
        continue;
      }

      await repository.save(
        repository.create({ name, category: 'General', level: null, icon: null }),
      );
      console.log(`Skill fixture "${name}" created`);
    }
  }
}

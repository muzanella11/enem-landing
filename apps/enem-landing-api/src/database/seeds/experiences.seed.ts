import { DataSource } from 'typeorm';
import type { Seeder } from 'typeorm-extension';
import { ExperienceEntity } from '../../app/experiences/experience.entity.js';
import { ProjectEntity } from '../../app/experiences/project.entity.js';
import { EXPERIENCES_FIXTURE } from './experiences.fixture.js';

/**
 * Idempotent, but deliberately skip-not-overwrite: once an experience (matched
 * by `company`+`position`) exists it is left untouched, rather than the
 * update-or-create pattern other seeders in this repo use. This data is
 * meant to be edited afterwards via the CMS (including per-project image
 * uploads) - replacing projects wholesale on every run would wipe out those
 * uploads.
 */
export default class ExperiencesSeed implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const experiencesRepository = dataSource.getRepository(ExperienceEntity);
    const projectsRepository = dataSource.getRepository(ProjectEntity);

    for (const fixture of EXPERIENCES_FIXTURE) {
      const existing = await experiencesRepository.findOne({
        where: { company: fixture.company, position: fixture.position },
      });

      if (existing) {
        console.log(
          `Experience fixture "${fixture.company} - ${fixture.position}" already exists, skipped`,
        );
        continue;
      }

      const { projects, ...experienceData } = fixture;
      const saved = await experiencesRepository.save(
        experiencesRepository.create(experienceData),
      );
      await projectsRepository.save(
        projects.map((project) =>
          projectsRepository.create({ ...project, experienceId: saved.id }),
        ),
      );

      console.log(
        `Experience fixture "${fixture.company} - ${fixture.position}" created (${projects.length} projects)`,
      );
    }
  }
}

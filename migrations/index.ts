import * as migration_20260502_154117___name from './20260502_154117___name';
import * as migration_20260527_153859_add_articles_and_image_admin_labels from './20260527_153859_add_articles_and_image_admin_labels';
import * as migration_20261002_103348_portfolio_stability_schema from './20261002_103348_portfolio_stability_schema';
import * as migration_20261002_151056 from './20261002_151056';
import * as migration_20261002_153655_media_prefix from './20261002_153655_media_prefix';

export const migrations = [
  {
    up: migration_20260502_154117___name.up,
    down: migration_20260502_154117___name.down,
    name: '20260502_154117___name',
  },
  {
    up: migration_20260527_153859_add_articles_and_image_admin_labels.up,
    down: migration_20260527_153859_add_articles_and_image_admin_labels.down,
    name: '20260527_153859_add_articles_and_image_admin_labels',
  },
  {
    up: migration_20261002_103348_portfolio_stability_schema.up,
    down: migration_20261002_103348_portfolio_stability_schema.down,
    name: '20261002_103348_portfolio_stability_schema',
  },
  {
    up: migration_20261002_151056.up,
    down: migration_20261002_151056.down,
    name: '20261002_151056',
  },
  {
    up: migration_20261002_153655_media_prefix.up,
    down: migration_20261002_153655_media_prefix.down,
    name: '20261002_153655_media_prefix'
  },
];

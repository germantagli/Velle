import {Module} from '@nestjs/common';
import {DwollaService} from './dwolla.service';

@Module({
  providers: [DwollaService],
  exports: [DwollaService],
})
export class DwollaModule {}

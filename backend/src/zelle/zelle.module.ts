import {Module} from '@nestjs/common';
import {ZelleController} from './zelle.controller';
import {ZelleService} from './zelle.service';

@Module({
  controllers: [ZelleController],
  providers: [ZelleService],
})
export class ZelleModule {}

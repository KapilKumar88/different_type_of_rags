import { Module } from '@nestjs/common';
import { TavilyWebSearchService } from './tavily-web-search.service';

@Module({
  providers: [TavilyWebSearchService],
  exports: [TavilyWebSearchService],
})
export class WebSearchModule {}

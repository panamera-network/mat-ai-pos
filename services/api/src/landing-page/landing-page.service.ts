import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLandingPageContentDto } from './dto/create-landing-page-content.dto';
import { UpdateLandingPageContentDto } from './dto/update-landing-page-content.dto';

@Injectable()
export class LandingPageService {
  constructor(private prisma: PrismaService) {}

  async findAll(outletId?: string) {
    return this.prisma.landingPageContent.findMany({
      where: outletId ? { outletId } : {},
      orderBy: [{ section: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async findBySection(section: string, outletId?: string) {
    return this.prisma.landingPageContent.findMany({
      where: {
        section,
        isActive: true,
        ...(outletId && { outletId }),
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findPublic(outletId?: string) {
    const items = await this.prisma.landingPageContent.findMany({
      where: {
        isActive: true,
        ...(outletId && { outletId }),
      },
      orderBy: [{ section: 'asc' }, { sortOrder: 'asc' }],
      select: {
        section: true,
        key: true,
        content: true,
        sortOrder: true,
      },
    });

    const grouped: Record<string, any[]> = {};
    for (const item of items) {
      if (!grouped[item.section]) grouped[item.section] = [];
      grouped[item.section].push({
        key: item.key,
        content: item.content,
        sortOrder: item.sortOrder,
      });
    }
    return grouped;
  }

  async create(dto: CreateLandingPageContentDto) {
    return this.prisma.landingPageContent.create({
      data: {
        section: dto.section,
        key: dto.key,
        content: dto.content,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
        outletId: dto.outletId,
      },
    });
  }

  async update(id: string, dto: UpdateLandingPageContentDto) {
    const existing = await this.prisma.landingPageContent.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Content not found');

    return this.prisma.landingPageContent.update({
      where: { id },
      data: {
        ...(dto.content && { content: dto.content }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.landingPageContent.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Content not found');

    return this.prisma.landingPageContent.delete({ where: { id } });
  }

  async seedDefault(outletId?: string) {
    const defaults = [
      {
        section: 'hero',
        key: 'main',
        content: {
          title: 'MAT.ai Kitchen',
          tagline: 'Order. Eat. Earn Rewards.',
          subtitle: 'Welcome to',
          ctaText: 'Browse Menu',
          gradient: 'from-orange-500 via-red-500 to-pink-600',
        },
        sortOrder: 0,
      },
      {
        section: 'features',
        key: 'earn_points',
        content: {
          icon: 'Gift',
          title: 'Earn Points',
          description: '1pt / RM1',
        },
        sortOrder: 0,
      },
      {
        section: 'features',
        key: 'exclusive_deals',
        content: {
          icon: 'Sparkles',
          title: 'Exclusive Deals',
          description: 'Members only',
        },
        sortOrder: 1,
      },
      {
        section: 'features',
        key: 'vip_rewards',
        content: {
          icon: 'Star',
          title: 'VIP Rewards',
          description: 'Special perks',
        },
        sortOrder: 2,
      },
      {
        section: 'footer',
        key: 'main',
        content: {
          text: 'Powered by MAT.ai',
          showLogo: true,
        },
        sortOrder: 0,
      },
    ];

    const created = [];
    for (const item of defaults) {
      const existing = await this.prisma.landingPageContent.findFirst({
        where: {
          section: item.section,
          key: item.key,
          ...(outletId && { outletId }),
        },
      });

      if (!existing) {
        created.push(
          await this.prisma.landingPageContent.create({
            data: { ...item, outletId },
          })
        );
      }
    }
    return created;
  }
}
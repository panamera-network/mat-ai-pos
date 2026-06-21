import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      include: { _count: { select: { staff: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.role.findUnique({
      where: { id },
      include: { staff: true },
    });
  }

  async create(data: { name: string; permissions: Record<string, boolean>; isActive?: boolean }) {
    return this.prisma.role.create({
      data: {
        name: data.name,
        permissions: data.permissions as any,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: { name?: string; permissions?: Record<string, boolean>; isActive?: boolean }) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (role?.isSystem) {
      throw new BadRequestException('Cannot modify system role');
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        ...data,
        permissions: data.permissions ? (data.permissions as any) : undefined,
      },
    });
  }

  async delete(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (role?.isSystem) {
      throw new BadRequestException('Cannot delete system role');
    }

    // Check if role has staff
    const staffCount = await this.prisma.staff.count({ where: { roleId: id } });
    if (staffCount > 0) {
      throw new BadRequestException(`Cannot delete role with ${staffCount} assigned staff`);
    }

    return this.prisma.role.delete({ where: { id } });
  }
}
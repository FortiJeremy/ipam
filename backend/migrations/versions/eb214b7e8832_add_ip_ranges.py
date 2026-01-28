"""add ip_ranges

Revision ID: eb214b7e8832
Revises: 7219b758cb71
Create Date: 2026-01-28 15:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'eb214b7e8832'
down_revision: Union[str, Sequence[str], None] = '7219b758cb71'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table('ip_ranges',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('subnet_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('start_ip', sa.String(), nullable=True),
        sa.Column('end_ip', sa.String(), nullable=True),
        sa.Column('purpose', sa.String(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['subnet_id'], ['subnets.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ip_ranges_end_ip'), 'ip_ranges', ['end_ip'], unique=False)
    op.create_index(op.f('ix_ip_ranges_id'), 'ip_ranges', ['id'], unique=False)
    op.create_index(op.f('ix_ip_ranges_name'), 'ip_ranges', ['name'], unique=False)
    op.create_index(op.f('ix_ip_ranges_start_ip'), 'ip_ranges', ['start_ip'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_ip_ranges_start_ip'), table_name='ip_ranges')
    op.drop_index(op.f('ix_ip_ranges_name'), table_name='ip_ranges')
    op.drop_index(op.f('ix_ip_ranges_id'), table_name='ip_ranges')
    op.drop_index(op.f('ix_ip_ranges_end_ip'), table_name='ip_ranges')
    op.drop_table('ip_ranges')

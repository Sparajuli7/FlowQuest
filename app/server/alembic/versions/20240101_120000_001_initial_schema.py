"""Initial schema with users, quests, shots, and artifacts

Revision ID: 001
Revises: 
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('is_demo', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # Create quests table
    op.create_table('quests',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('template_key', sa.String(), nullable=False),
        sa.Column('template_version', sa.String(), nullable=False),
        sa.Column('inputs', sa.JSON(), nullable=False),
        sa.Column('constraints', sa.JSON(), nullable=True),
        sa.Column('checkpoints', sa.JSON(), nullable=False),
        sa.Column('steps_taken', sa.JSON(), nullable=True),
        sa.Column('status', sa.Enum('PREVIEW', 'RENDERING', 'READY', 'EXPORTING', 'COMPLETED', 'FAILED', name='queststatus'), nullable=True),
        sa.Column('preview_url', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create shots table
    op.create_table('shots',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('quest_id', sa.String(), nullable=False),
        sa.Column('step_ids', sa.JSON(), nullable=False),
        sa.Column('seed', sa.Integer(), nullable=False),
        sa.Column('bindings', sa.JSON(), nullable=False),
        sa.Column('duration', sa.Float(), nullable=False),
        sa.Column('overlays', sa.JSON(), nullable=False),
        sa.Column('render_url', sa.String(), nullable=True),
        sa.Column('cache_key', sa.String(), nullable=True),
        sa.Column('is_cached', sa.Boolean(), nullable=True),
        sa.Column('render_time_ms', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['quest_id'], ['quests.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create artifacts table
    op.create_table('artifacts',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('quest_id', sa.String(), nullable=False),
        sa.Column('type', sa.Enum('PDF', 'ICS', 'MARKDOWN', 'CSV', 'RECEIPT', name='artifacttype'), nullable=False),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('url', sa.String(), nullable=False),
        sa.Column('content_hash', sa.String(), nullable=True),
        sa.Column('size_bytes', sa.Integer(), nullable=True),
        sa.Column('receipt_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['quest_id'], ['quests.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('artifacts')
    op.drop_table('shots')
    op.drop_table('quests')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS artifacttype')
    op.execute('DROP TYPE IF EXISTS queststatus')

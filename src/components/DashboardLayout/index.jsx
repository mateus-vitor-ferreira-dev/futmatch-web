import {
  Shell, Sidebar, Logo, LogoIcon, LogoText, LogoName, LogoTagline,
  Divider, Nav, NavItem, NavBadge,
  UserCard, Avatar, UserInfo, UserName, UserRole,
  Main, Topbar, TopbarRow, TopbarTitle, TopbarSub, TopbarActions, Content,
} from './styles'

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase()).join('')
}

/**
 * Layout compartilhado para os painéis de Admin e Owner.
 *
 * @param {{
 *   user: object,
 *   navItems: Array<{ to: string, label: string, icon: React.ElementType, badge?: number }>,
 *   tagline: string,
 *   accent: string,
 *   pageTitle: string,
 *   pageSub?: string,
 *   topbarActions?: React.ReactNode,
 *   children: React.ReactNode,
 * }} props
 */
export default function DashboardLayout({
  user,
  navItems,
  tagline,
  accent,
  pageTitle,
  pageSub,
  topbarActions,
  children,
}) {
  return (
    <Shell>
      <Sidebar>
        <Logo>
          <LogoIcon>⚽</LogoIcon>
          <LogoText>
            <LogoName>Só+1</LogoName>
            <LogoTagline accent={accent}>{tagline}</LogoTagline>
          </LogoText>
        </Logo>

        <Divider />

        <Nav>
          {navItems.map(({ to, label, icon: Icon, badge, divider }) => (
            <span key={to}>
              {divider && <Divider />}
              <NavItem to={to}>
                <Icon size={18} />
                {label}
                {badge > 0 && <NavBadge>{badge}</NavBadge>}
              </NavItem>
            </span>
          ))}
        </Nav>

        {user && (
          <UserCard>
            <Avatar>{getInitials(user.name)}</Avatar>
            <UserInfo>
              <UserName>{user.name}</UserName>
              <UserRole accent={accent}>{user.role}</UserRole>
            </UserInfo>
          </UserCard>
        )}
      </Sidebar>

      <Main>
        <Topbar>
          <TopbarRow>
            <div>
              <TopbarTitle>{pageTitle}</TopbarTitle>
              {pageSub && <TopbarSub>{pageSub}</TopbarSub>}
            </div>
            {topbarActions && <TopbarActions>{topbarActions}</TopbarActions>}
          </TopbarRow>
        </Topbar>

        <Content>{children}</Content>
      </Main>
    </Shell>
  )
}
